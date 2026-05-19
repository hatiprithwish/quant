import { v4 as uuidv4 } from "uuid";
import { DrizzleDb } from "../db";
import { TrajectoryDAL } from "../data-access-layer/TrajectoryDAL";
import {
  UpsertTrajectoryConfigRepoRequest,
  CreateTrajectoryQuestRepoRequest,
  UpdateTrajectoryQuestRepoRequest,
  CreateGoalChangeRepoRequest,
  ConfirmGoalChangeRepoRequest,
  CreateEliminationItemRepoRequest,
  UpdateEliminationItemRepoRequest,
  SubmitCheckinCorrectionRepoRequest,
  LockInWeekRepoRequest,
  UpdateTaskPhaseTagRepoRequest,
  TrajectoryPhaseEnum,
  WeeklyCheckinStatusEnum,
  GoalChangeTypeEnum,
  GetTrajectoryConfigResponse,
  GetVaultResponse,
  GetTrajectoryDashboardResponse,
  GetWeeklyCheckinResponse,
  GetCheckinHistoryResponse,
  CreateGoalChangeResponse,
  GetEliminationItemsResponse,
  TrajectoryQuestData,
  WeeklyCheckinData,
  EliminationItemData,
  GoalChangeRequestData,
  ScoreHistoryData,
} from "../schemas";
import { AppConstants } from "../config/Constants";

const QUARTERLY_CAP = AppConstants.TRAJECTORY.QUARTERLY_CAP;
const COOLING_OFF_HOURS = AppConstants.TRAJECTORY.COOLING_OFF_HOURS;
const GOAL_CHANGE_XP_PENALTY = AppConstants.TRAJECTORY.GOAL_CHANGE_XP_PENALTY;

function computeWeeklyScore(
  taskScore: number,
  eliminationScore: number,
  decisionScore: number,
  confidenceScore: number,
): number {
  return Math.round(
    taskScore * 0.4 +
    eliminationScore * 0.25 +
    decisionScore * 0.25 +
    confidenceScore * 0.1,
  );
}

function toTrajectoryQuestData(row: any): TrajectoryQuestData {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description ?? null,
    trajectory_phase: row.trajectory_phase,
    parent_quest_id: row.parent_quest_id ?? null,
    color: row.color,
    deadline: row.deadline ?? null,
    escape_number: row.escape_number ?? null,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toWeeklyCheckinData(row: any): WeeklyCheckinData {
  return {
    id: row.id,
    user_id: row.user_id,
    week_start: row.week_start,
    task_completion_score: row.task_completion_score ?? null,
    elimination_score: row.elimination_score ?? null,
    decision_alignment_score: row.decision_alignment_score ?? null,
    confidence_score: row.confidence_score ?? null,
    weekly_score: row.weekly_score ?? null,
    ai_analysis: row.ai_analysis ?? null,
    user_corrections: row.user_corrections ?? null,
    ai_model_version: row.ai_model_version ?? null,
    status: row.status,
    reviewed_at: row.reviewed_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class TrajectoryRepo {
  // ── Config ─────────────────────────────────────────────────────────────────

  static async getConfig(userId: string, db: DrizzleDb): Promise<GetTrajectoryConfigResponse> {
    const row = await TrajectoryDAL.findConfig(userId, db);
    return {
      isSuccess: true,
      message: "OK",
      config: row
        ? {
            id: row.id,
            user_id: row.user_id,
            escape_number: row.escape_number ?? null,
            monthly_investment_target: row.monthly_investment_target ?? null,
            assumed_annual_return_rate: row.assumed_annual_return_rate ?? null,
            current_monthly_income: row.current_monthly_income ?? null,
            income_milestone_year1: row.income_milestone_year1 ?? null,
            income_milestone_year3: row.income_milestone_year3 ?? null,
            checkin_due: row.checkin_due,
            created_at: row.created_at,
            updated_at: row.updated_at,
          }
        : null,
    };
  }

  static async upsertConfig(req: UpsertTrajectoryConfigRepoRequest, db: DrizzleDb): Promise<GetTrajectoryConfigResponse> {
    await TrajectoryDAL.upsertConfig(req, db);
    return TrajectoryRepo.getConfig(req.userId, db);
  }

  // ── Vault ──────────────────────────────────────────────────────────────────

  static async getVault(userId: string, db: DrizzleDb): Promise<GetVaultResponse> {
    const rows = await TrajectoryDAL.findVaultQuests({ userId }, db);
    const grouped: Record<string, TrajectoryQuestData[]> = {
      five_year: [],
      three_year: [],
      one_year: [],
      quarterly: [],
      weekly: [],
    };
    for (const row of rows) {
      const phase = row.trajectory_phase as string;
      if (phase && phase in grouped) {
        grouped[phase].push(toTrajectoryQuestData(row));
      }
    }
    const quarterlyActiveCount = grouped.quarterly.filter((q) => q.status === "active").length;
    return {
      isSuccess: true,
      message: "OK",
      five_year: grouped.five_year,
      three_year: grouped.three_year,
      one_year: grouped.one_year,
      quarterly: grouped.quarterly,
      weekly: grouped.weekly,
      quarterly_active_count: quarterlyActiveCount,
      quarterly_max: QUARTERLY_CAP,
    };
  }

  static async createVaultQuest(req: CreateTrajectoryQuestRepoRequest, db: DrizzleDb) {
    if (req.trajectory_phase === TrajectoryPhaseEnum.Quarterly) {
      const activeCount = await TrajectoryDAL.countActiveQuarterly(
        { userId: req.userId, quarter_start: "" },
        db,
      );
      if (activeCount >= QUARTERLY_CAP) {
        return {
          isSuccess: false,
          message: `Quarterly goals capped at ${QUARTERLY_CAP}. Complete or archive an existing goal first.`,
        };
      }
    }
    const id = uuidv4();
    await TrajectoryDAL.insertVaultQuest({ id, ...req }, db);
    return { isSuccess: true, message: "Quest created", id };
  }

  static async updateVaultQuest(req: UpdateTrajectoryQuestRepoRequest, db: DrizzleDb) {
    await TrajectoryDAL.updateVaultQuest(req, db);
    return { isSuccess: true, message: "Quest updated" };
  }

  // ── Goal Change Requests ───────────────────────────────────────────────────

  static async createGoalChangeRequest(req: CreateGoalChangeRepoRequest, db: DrizzleDb): Promise<CreateGoalChangeResponse> {
    const quest = await TrajectoryDAL.findVaultQuests({ userId: req.userId }, db)
      .then((rows: any[]) => rows.find((r: any) => r.id === req.quest_id) ?? null);
    if (!quest) {
      return { isSuccess: false, message: "Quest not found", change_request: null, cooling_off_until: null, xp_penalty: 0 };
    }
    const isPanic = req.change_type === GoalChangeTypeEnum.Panic;
    const xpPenalty = isPanic ? GOAL_CHANGE_XP_PENALTY * 2 : GOAL_CHANGE_XP_PENALTY;
    const coolingOffUntil = new Date(Date.now() + COOLING_OFF_HOURS * 60 * 60 * 1000).toISOString();

    const row = await TrajectoryDAL.insertGoalChangeRequest({
      userId: req.userId,
      quest_id: req.quest_id,
      change_type: req.change_type,
      reason: req.reason,
      old_description: quest.description ?? undefined,
      new_description: req.new_description,
      xp_penalty: xpPenalty,
      cooling_off_until: coolingOffUntil,
    }, db);

    const changeRequest: GoalChangeRequestData = {
      id: row!.id,
      user_id: req.userId,
      quest_id: req.quest_id,
      change_type: req.change_type,
      reason: req.reason,
      old_description: quest.description ?? null,
      new_description: req.new_description ?? null,
      xp_penalty: xpPenalty,
      cooling_off_until: coolingOffUntil,
      confirmed_at: null,
      cancelled_at: null,
      created_at: new Date().toISOString(),
    };

    return {
      isSuccess: true,
      message: "Change request created. Cooling-off period started.",
      change_request: changeRequest,
      cooling_off_until: coolingOffUntil,
      xp_penalty: xpPenalty,
    };
  }

  static async confirmGoalChangeRequest(req: ConfirmGoalChangeRepoRequest, db: DrizzleDb) {
    const request = await TrajectoryDAL.findGoalChangeRequest(
      { changeRequestId: req.change_request_id, userId: req.userId },
      db,
    );
    if (!request) {
      return { isSuccess: false, message: "Change request not found" };
    }
    if (request.confirmed_at) {
      return { isSuccess: false, message: "Already committed" };
    }
    const now = new Date();
    const coolingOff = new Date(request.cooling_off_until);
    if (now < coolingOff) {
      return {
        isSuccess: false,
        message: `Cooling-off period not elapsed. Try again after ${request.cooling_off_until}.`,
      };
    }
    await TrajectoryDAL.commitGoalChangeRequest(req.change_request_id, db);
    if (request.new_description) {
      await TrajectoryDAL.updateVaultQuest(
        { questId: request.quest_id, userId: req.userId, description: request.new_description },
        db,
      );
    }
    return { isSuccess: true, message: "Goal change committed" };
  }

  // ── Elimination Items ──────────────────────────────────────────────────────

  static async getEliminationItems(userId: string, weekStart: string, db: DrizzleDb): Promise<GetEliminationItemsResponse> {
    const rows = await TrajectoryDAL.findEliminationItems({ userId, week_start: weekStart }, db);
    const items: EliminationItemData[] = rows.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      week_start: r.week_start,
      description: r.description,
      linked_time_bucket_id: r.linked_time_bucket_id ?? null,
      linked_money_category_id: r.linked_money_category_id ?? null,
      linked_food_type: r.linked_food_type ?? null,
      result: r.result ?? null,
      notes: r.notes ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
    return { isSuccess: true, message: "OK", items };
  }

  static async createEliminationItem(req: CreateEliminationItemRepoRequest, db: DrizzleDb) {
    await TrajectoryDAL.insertEliminationItem(req, db);
    return { isSuccess: true, message: "Elimination item created" };
  }

  static async updateEliminationItem(req: UpdateEliminationItemRepoRequest, db: DrizzleDb) {
    await TrajectoryDAL.updateEliminationItem(req, db);
    return { isSuccess: true, message: "Updated" };
  }

  // ── Weekly Check-In ────────────────────────────────────────────────────────

  static async getWeeklyCheckin(userId: string, weekStart: string, db: DrizzleDb): Promise<GetWeeklyCheckinResponse> {
    const row = await TrajectoryDAL.findWeeklyCheckin({ userId, week_start: weekStart }, db);
    if (!row) {
      return { isSuccess: true, message: "OK", checkin: null, analysis: null };
    }
    const checkin = toWeeklyCheckinData(row);
    let analysis = null;
    if (row.ai_analysis) {
      try {
        analysis = JSON.parse(row.ai_analysis);
      } catch {
        analysis = null;
      }
    }
    return { isSuccess: true, message: "OK", checkin, analysis };
  }

  static async getCheckinHistory(userId: string, limit: number, offset: number, db: DrizzleDb): Promise<GetCheckinHistoryResponse> {
    const rows = await TrajectoryDAL.findCheckinHistory({ userId, limit, offset }, db);
    return {
      isSuccess: true,
      message: "OK",
      checkins: rows.map(toWeeklyCheckinData),
    };
  }

  static async submitCheckinCorrection(req: SubmitCheckinCorrectionRepoRequest, db: DrizzleDb) {
    const existing = await TrajectoryDAL.findWeeklyCheckin(
      { userId: req.userId, week_start: req.week_start },
      db,
    );
    if (!existing) {
      return { isSuccess: false, message: "No check-in found for this week" };
    }
    const merged = {
      ...(existing.user_corrections ? JSON.parse(existing.user_corrections) : {}),
      ...req.corrections,
    };
    let updatedScore = existing.confidence_score;
    if (req.confidence_override !== undefined) {
      updatedScore = req.confidence_override;
    }
    await TrajectoryDAL.upsertWeeklyCheckin(
      {
        userId: req.userId,
        week_start: req.week_start,
        confidence_score: updatedScore ?? undefined,
        user_corrections: JSON.stringify(merged),
      },
      db,
    );
    return { isSuccess: true, message: "Corrections saved" };
  }

  static async lockInWeek(req: LockInWeekRepoRequest, db: DrizzleDb) {
    const existing = await TrajectoryDAL.findWeeklyCheckin(
      { userId: req.userId, week_start: req.week_start },
      db,
    );
    if (!existing) {
      return { isSuccess: false, message: "No check-in found for this week" };
    }
    if (existing.status === WeeklyCheckinStatusEnum.Reviewed) {
      return { isSuccess: false, message: "Week already locked in" };
    }
    // Recompute final composite score from component scores
    const tc = existing.task_completion_score ?? 0;
    const el = existing.elimination_score ?? 0;
    const da = existing.decision_alignment_score ?? 0;
    const cf = existing.confidence_score ?? 50;
    const finalScore = computeWeeklyScore(tc, el, da, cf);

    await TrajectoryDAL.upsertWeeklyCheckin(
      {
        userId: req.userId,
        week_start: req.week_start,
        weekly_score: finalScore,
        status: WeeklyCheckinStatusEnum.Reviewed,
        reviewed_at: new Date().toISOString(),
      },
      db,
    );
    // Persist to score_history
    await TrajectoryDAL.insertScoreHistory(
      {
        userId: req.userId,
        period_type: "weekly",
        period_start: req.week_start,
        score: finalScore,
        component_scores: JSON.stringify({ tc, el, da, cf }),
      },
      db,
    );
    return { isSuccess: true, message: "Week locked in", score: finalScore };
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  static async getDashboard(userId: string, db: DrizzleDb): Promise<GetTrajectoryDashboardResponse> {
    const [config, recentScores] = await Promise.all([
      TrajectoryDAL.findConfig(userId, db),
      TrajectoryDAL.findScoreHistory({ userId, period_type: "weekly", limit: 4 }, db),
    ]);

    // Get current week's check-in
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekStart = monday.toISOString().slice(0, 10);
    const currentCheckin = await TrajectoryDAL.findWeeklyCheckin({ userId, week_start: weekStart }, db);

    const scores: ScoreHistoryData[] = recentScores.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      period_type: r.period_type,
      period_start: r.period_start,
      score: r.score,
      component_scores: r.component_scores ?? null,
      created_at: r.created_at,
    }));

    // Drift score = average of last 4 weekly scores (simple heuristic)
    const driftScore = scores.length > 0
      ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length)
      : null;
    const driftStatus = driftScore === null
      ? "on_track"
      : driftScore >= 70
        ? "on_track"
        : driftScore >= 40
          ? "drifting"
          : "misaligned";

    // Escape number progress
    const escapeNumber = config?.escape_number ?? null;
    const currentInvestedCapital: number | null = null; // Would join investment_accounts in a full impl

    let projectedArrivalDate: string | null = null;
    if (escapeNumber && config?.monthly_investment_target && config?.assumed_annual_return_rate) {
      const r = config.assumed_annual_return_rate / 12;
      const pmt = config.monthly_investment_target;
      if (r > 0 && pmt > 0) {
        const months = Math.log(1 + (escapeNumber * r) / pmt) / Math.log(1 + r);
        const arrival = new Date();
        arrival.setMonth(arrival.getMonth() + Math.ceil(months));
        projectedArrivalDate = arrival.toISOString().slice(0, 10);
      }
    }

    // Income gap warning
    const currentIncome = config?.current_monthly_income ?? 0;
    const requiredInvestment = config?.monthly_investment_target ?? 0;
    const estimatedSaveable = currentIncome * 0.2;
    const incomeGapWarning = requiredInvestment > 0 && estimatedSaveable < requiredInvestment;
    const incomeGapAmount = incomeGapWarning ? requiredInvestment - estimatedSaveable : null;

    const checkin = currentCheckin ? toWeeklyCheckinData(currentCheckin) : null;
    let scoreComponents = null;
    if (currentCheckin &&
      currentCheckin.task_completion_score !== null &&
      currentCheckin.elimination_score !== null &&
      currentCheckin.decision_alignment_score !== null &&
      currentCheckin.confidence_score !== null
    ) {
      const tc = currentCheckin.task_completion_score;
      const el = currentCheckin.elimination_score;
      const da = currentCheckin.decision_alignment_score;
      const cf = currentCheckin.confidence_score;
      const wt = currentCheckin.weekly_score ?? computeWeeklyScore(tc, el, da, cf);
      scoreComponents = {
        task_completion: tc,
        elimination: el,
        decision_alignment: da,
        confidence: cf,
        weighted_total: wt,
      };
    }

    return {
      isSuccess: true,
      message: "OK",
      current_week: checkin,
      score_components: scoreComponents,
      drift_status: driftStatus,
      drift_score: driftScore,
      recent_scores: scores,
      escape_number: escapeNumber,
      current_invested_capital: currentInvestedCapital,
      projected_arrival_date: projectedArrivalDate,
      income_gap_warning: incomeGapWarning,
      income_gap_amount: incomeGapAmount,
    };
  }

  // ── Task Phase Tag ─────────────────────────────────────────────────────────

  static async updateTaskPhaseTag(req: UpdateTaskPhaseTagRepoRequest, db: DrizzleDb) {
    await TrajectoryDAL.updateTaskPhaseTag(req, db);
    return { isSuccess: true, message: "Phase tag updated" };
  }
}

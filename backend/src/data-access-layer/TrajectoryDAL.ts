import { and, eq, desc, sql, count } from "drizzle-orm";
import { DrizzleDb } from "../db";
import {
  trajectoryConfig,
  weeklyCheckins,
  goalChangeRequests,
  eliminationItems,
  scoreHistory,
  decisionLogs,
  quests,
  questTasks,
} from "../db/tables";
import {
  UpsertTrajectoryConfigDbRequest,
  GetVaultQuestsDbRequest,
  CreateTrajectoryQuestDbRequest,
  UpdateTrajectoryQuestDbRequest,
  GetActiveQuarterlyCountDbRequest,
  CreateGoalChangeRequestDbRequest,
  GetGoalChangeRequestDbRequest,
  CreateEliminationItemDbRequest,
  UpdateEliminationItemDbRequest,
  GetEliminationItemsDbRequest,
  UpsertWeeklyCheckinDbRequest,
  GetWeeklyCheckinDbRequest,
  GetCheckinHistoryDbRequest,
  InsertScoreHistoryDbRequest,
  GetScoreHistoryDbRequest,
  UpdateTaskPhaseTagDbRequest,
  InsertDecisionLogDbRequest,
  TrajectoryPhaseEnum,
} from "../schemas";

export class TrajectoryDAL {
  // ── Trajectory Config ──────────────────────────────────────────────────────

  static async findConfig(userId: string, db: DrizzleDb) {
    const rows = await db
      .select()
      .from(trajectoryConfig)
      .where(eq(trajectoryConfig.user_id, userId))
      .limit(1);
    return rows[0] ?? null;
  }

  static async upsertConfig(data: UpsertTrajectoryConfigDbRequest, db: DrizzleDb) {
    await db
      .insert(trajectoryConfig)
      .values({
        user_id: data.userId,
        escape_number: data.escape_number,
        monthly_investment_target: data.monthly_investment_target,
        assumed_annual_return_rate: data.assumed_annual_return_rate,
        current_monthly_income: data.current_monthly_income,
        income_milestone_year1: data.income_milestone_year1,
        income_milestone_year3: data.income_milestone_year3,
      })
      .onConflictDoUpdate({
        target: trajectoryConfig.user_id,
        set: {
          escape_number: data.escape_number,
          monthly_investment_target: data.monthly_investment_target,
          assumed_annual_return_rate: data.assumed_annual_return_rate,
          current_monthly_income: data.current_monthly_income,
          income_milestone_year1: data.income_milestone_year1,
          income_milestone_year3: data.income_milestone_year3,
          updated_at: sql`(datetime('now'))`,
        },
      });
  }

  // ── Vault Quests ───────────────────────────────────────────────────────────

  static async findVaultQuests(req: GetVaultQuestsDbRequest, db: DrizzleDb) {
    const conditions = [
      eq(quests.user_id, req.userId),
      sql`${quests.trajectory_phase} IS NOT NULL`,
      sql`${quests.deleted_at} IS NULL`,
    ];
    if (req.phase) {
      conditions.push(eq(quests.trajectory_phase as any, req.phase));
    }
    return db
      .select()
      .from(quests)
      .where(and(...conditions))
      .orderBy(desc(quests.created_at));
  }

  static async insertVaultQuest(data: CreateTrajectoryQuestDbRequest, db: DrizzleDb) {
    await db.insert(quests).values({
      id: data.id,
      user_id: data.userId,
      name: data.name,
      description: data.description,
      trajectory_phase: data.trajectory_phase,
      parent_quest_id: data.parent_quest_id,
      color: data.color,
      deadline: data.deadline,
      escape_number: data.escape_number,
      status: "active" as any,
      category: "growth" as any,
    });
  }

  static async updateVaultQuest(data: UpdateTrajectoryQuestDbRequest, db: DrizzleDb) {
    await db
      .update(quests)
      .set({
        name: data.name,
        description: data.description,
        color: data.color,
        deadline: data.deadline,
        escape_number: data.escape_number,
        parent_quest_id: data.parent_quest_id,
        updated_at: sql`(datetime('now'))`,
      })
      .where(and(eq(quests.id, data.questId), eq(quests.user_id, data.userId)));
  }

  static async countActiveQuarterly(req: GetActiveQuarterlyCountDbRequest, db: DrizzleDb) {
    const rows = await db
      .select({ n: count() })
      .from(quests)
      .where(
        and(
          eq(quests.user_id, req.userId),
          eq(quests.trajectory_phase as any, TrajectoryPhaseEnum.Quarterly),
          eq(quests.status as any, "active"),
          sql`${quests.deleted_at} IS NULL`,
        ),
      );
    return rows[0]?.n ?? 0;
  }

  // ── Goal Change Requests ───────────────────────────────────────────────────

  static async insertGoalChangeRequest(data: CreateGoalChangeRequestDbRequest, db: DrizzleDb) {
    const rows = await db
      .insert(goalChangeRequests)
      .values({
        user_id: data.userId,
        quest_id: data.quest_id,
        change_type: data.change_type,
        reason: data.reason,
        old_description: data.old_description,
        new_description: data.new_description,
        xp_penalty: data.xp_penalty,
        cooling_off_until: data.cooling_off_until,
      })
      .returning({ id: goalChangeRequests.id });
    return rows[0] ?? null;
  }

  static async findGoalChangeRequest(req: GetGoalChangeRequestDbRequest, db: DrizzleDb) {
    const rows = await db
      .select()
      .from(goalChangeRequests)
      .where(
        and(
          eq(goalChangeRequests.id, req.changeRequestId),
          eq(goalChangeRequests.user_id, req.userId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  static async commitGoalChangeRequest(changeRequestId: number, db: DrizzleDb) {
    await db
      .update(goalChangeRequests)
      .set({ confirmed_at: sql`(datetime('now'))` })
      .where(eq(goalChangeRequests.id, changeRequestId));
  }

  // ── Elimination Items ──────────────────────────────────────────────────────

  static async insertEliminationItem(data: CreateEliminationItemDbRequest, db: DrizzleDb) {
    const rows = await db
      .insert(eliminationItems)
      .values({
        user_id: data.userId,
        week_start: data.week_start,
        description: data.description,
        linked_time_bucket_id: data.linked_time_bucket_id,
        linked_money_category_id: data.linked_money_category_id,
        linked_food_type: data.linked_food_type,
      })
      .returning({ id: eliminationItems.id });
    return rows[0] ?? null;
  }

  static async updateEliminationItem(data: UpdateEliminationItemDbRequest, db: DrizzleDb) {
    await db
      .update(eliminationItems)
      .set({
        result: data.result,
        notes: data.notes,
        updated_at: sql`(datetime('now'))`,
      })
      .where(
        and(
          eq(eliminationItems.id, data.itemId),
          eq(eliminationItems.user_id, data.userId),
        ),
      );
  }

  static async findEliminationItems(req: GetEliminationItemsDbRequest, db: DrizzleDb) {
    return db
      .select()
      .from(eliminationItems)
      .where(
        and(
          eq(eliminationItems.user_id, req.userId),
          eq(eliminationItems.week_start, req.week_start),
        ),
      )
      .orderBy(desc(eliminationItems.created_at));
  }

  // ── Weekly Check-Ins ───────────────────────────────────────────────────────

  static async upsertWeeklyCheckin(data: UpsertWeeklyCheckinDbRequest, db: DrizzleDb) {
    await db
      .insert(weeklyCheckins)
      .values({
        user_id: data.userId,
        week_start: data.week_start,
        task_completion_score: data.task_completion_score,
        elimination_score: data.elimination_score,
        decision_alignment_score: data.decision_alignment_score,
        confidence_score: data.confidence_score,
        weekly_score: data.weekly_score,
        ai_analysis: data.ai_analysis,
        user_corrections: data.user_corrections,
        ai_model_version: data.ai_model_version,
        status: data.status,
        reviewed_at: data.reviewed_at,
      })
      .onConflictDoUpdate({
        target: [weeklyCheckins.user_id, weeklyCheckins.week_start],
        set: {
          task_completion_score: data.task_completion_score,
          elimination_score: data.elimination_score,
          decision_alignment_score: data.decision_alignment_score,
          confidence_score: data.confidence_score,
          weekly_score: data.weekly_score,
          ai_analysis: data.ai_analysis,
          user_corrections: data.user_corrections,
          ai_model_version: data.ai_model_version,
          status: data.status,
          reviewed_at: data.reviewed_at,
          updated_at: sql`(datetime('now'))`,
        },
      });
  }

  static async findWeeklyCheckin(req: GetWeeklyCheckinDbRequest, db: DrizzleDb) {
    const rows = await db
      .select()
      .from(weeklyCheckins)
      .where(
        and(
          eq(weeklyCheckins.user_id, req.userId),
          eq(weeklyCheckins.week_start, req.week_start),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  static async findCheckinHistory(req: GetCheckinHistoryDbRequest, db: DrizzleDb) {
    return db
      .select()
      .from(weeklyCheckins)
      .where(eq(weeklyCheckins.user_id, req.userId))
      .orderBy(desc(weeklyCheckins.week_start))
      .limit(req.limit ?? 20)
      .offset(req.offset ?? 0);
  }

  // ── Score History ──────────────────────────────────────────────────────────

  static async insertScoreHistory(data: InsertScoreHistoryDbRequest, db: DrizzleDb) {
    await db.insert(scoreHistory).values({
      user_id: data.userId,
      period_type: data.period_type,
      period_start: data.period_start,
      score: data.score,
      component_scores: data.component_scores,
    });
  }

  static async findScoreHistory(req: GetScoreHistoryDbRequest, db: DrizzleDb) {
    return db
      .select()
      .from(scoreHistory)
      .where(
        and(
          eq(scoreHistory.user_id, req.userId),
          eq(scoreHistory.period_type, req.period_type),
        ),
      )
      .orderBy(desc(scoreHistory.period_start))
      .limit(req.limit ?? 10);
  }

  // ── Task Phase Tag ─────────────────────────────────────────────────────────

  static async updateTaskPhaseTag(data: UpdateTaskPhaseTagDbRequest, db: DrizzleDb) {
    await db
      .update(questTasks)
      .set({
        phase_tag: data.phase_tag,
        updated_at: sql`(datetime('now'))`,
      })
      .where(
        and(
          eq(questTasks.id, data.taskId),
          // Verify ownership via quest join would be ideal; do a best-effort check via the task id
          // The repo layer is responsible for ownership validation
        ),
      );
  }

  // ── Decision Logs ──────────────────────────────────────────────────────────

  static async insertDecisionLog(data: InsertDecisionLogDbRequest, db: DrizzleDb) {
    await db.insert(decisionLogs).values({
      user_id: data.userId,
      week_start: data.week_start,
      description: data.description,
      alignment: data.alignment,
      related_quest_id: data.related_quest_id,
      source: data.source,
    });
  }

  static async findDecisionLogs(userId: string, week_start: string, db: DrizzleDb) {
    return db
      .select()
      .from(decisionLogs)
      .where(
        and(
          eq(decisionLogs.user_id, userId),
          eq(decisionLogs.week_start, week_start),
        ),
      )
      .orderBy(desc(decisionLogs.created_at));
  }

  // ── Weekly Score Inputs ────────────────────────────────────────────────────

  static async findTrajectoryTasks(userId: string, db: DrizzleDb) {
    return db
      .select()
      .from(questTasks)
      .innerJoin(quests, eq(questTasks.quest_id, quests.id))
      .where(
        and(
          eq(quests.user_id, userId),
          sql`${quests.deleted_at} IS NULL`,
          sql`${questTasks.phase_tag} IS NOT NULL OR ${quests.trajectory_phase} IS NOT NULL`,
        ),
      );
  }
}

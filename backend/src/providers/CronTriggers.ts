import { and, eq, gte, lte, desc, sql, count } from "drizzle-orm";
import { DrizzleDb } from "../db";
import {
  recurringTransactionItems,
  transferLogs,
  investmentCashFlows,
  assetValueSnapshots,
  users,
  trajectoryConfig,
  weeklyCheckins,
  scoreHistory,
  questTasks,
  quests,
  habitLogExtractions,
  dailyLogs,
  userAchievements,
  questXpEvents,
} from "../db/tables";
import { RecurringTransactionDAL } from "../data-access-layer/RecurringTransactionDAL";
import { ExpenseDAL } from "../data-access-layer/ExpenseDAL";
import { DepositDAL } from "../data-access-layer/DepositDAL";
import { InvestmentDAL } from "../data-access-layer/InvestmentDAL";
import { DailyLogDAL } from "../data-access-layer/DailyLogDAL";
import { HabitDAL } from "../data-access-layer/HabitDAL";
import {
  RecurringTransactionPeriodEnum,
  RecurringEndConditionEnum,
  WeeklyCheckinStatusEnum,
  XpSourceTypeEnum,
} from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";

function advanceDate(
  current: string,
  period: RecurringTransactionPeriodEnum,
  interval: number,
  weekDays: number[] | null,
  monthEnd: boolean,
): string {
  const d = new Date(current + "T00:00:00Z");

  if (period === RecurringTransactionPeriodEnum.Weekly) {
    if (weekDays && weekDays.length > 0) {
      const sorted = [...weekDays].sort((a, b) => a - b);
      const currentDay = d.getUTCDay();
      const nextDay = sorted.find((day) => day > currentDay);
      if (nextDay !== undefined) {
        d.setUTCDate(d.getUTCDate() + (nextDay - currentDay));
      } else {
        const daysToNextWeek = 7 - currentDay + sorted[0] + (interval - 1) * 7;
        d.setUTCDate(d.getUTCDate() + daysToNextWeek);
      }
    } else {
      d.setUTCDate(d.getUTCDate() + 7 * interval);
    }
  } else if (period === RecurringTransactionPeriodEnum.Monthly) {
    if (monthEnd) {
      d.setUTCMonth(d.getUTCMonth() + interval + 1, 0);
    } else {
      const day = d.getUTCDate();
      d.setUTCMonth(d.getUTCMonth() + interval);
      const maxDay = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
      ).getUTCDate();
      if (day > maxDay) d.setUTCDate(maxDay);
    }
  } else {
    d.setUTCFullYear(d.getUTCFullYear() + interval);
  }

  return d.toISOString().split("T")[0];
}

async function materializeTransfer(
  item: {
    user_id: string;
    wallet_id: number | null;
    to_wallet_id: number | null;
    asset_id: number | null;
    from_asset_id: number | null;
    amount: number;
    next_date: string;
    name: string;
    description: string | null;
  },
  db: DrizzleDb,
): Promise<void> {
  const desc = item.description ?? item.name;

  if (item.wallet_id !== null && item.to_wallet_id !== null) {
    // Wallet → Wallet
    await db.insert(transferLogs).values({
      user_id: item.user_id,
      from_wallet_id: item.wallet_id,
      to_wallet_id: item.to_wallet_id,
      date: item.next_date,
      amount: item.amount,
      currency: "INR",
      description: desc,
    });
  } else if (item.wallet_id !== null && item.asset_id !== null) {
    // Wallet → Investment Asset: single cashflow entry (transfer_type tracks the direction)
    await db.insert(investmentCashFlows).values({
      asset_id: item.asset_id,
      amount: item.amount,
      date: item.next_date,
      wallet_id: item.wallet_id,
      description: desc,
      transfer_type: "wallet_to_asset",
    });
  } else if (item.from_asset_id !== null && item.wallet_id !== null) {
    // Investment Asset → Wallet
    const asset = await InvestmentDAL.findAssetWithLatestSnapshot(item.from_asset_id, db);
    if (!asset || asset.current_value === null || asset.current_value <= 0) {
      Logger.error({
        correlationId: "cron",
        logCategory: AppConstants.LOG_CATEGORIES.CRON,
        logAction: "RecurringTransferSkipped",
        message: "Asset has no current value; skipping transfer",
        metadata: { assetId: item.from_asset_id },
      });
      return;
    }

    const transferAmount = Math.min(item.amount, asset.current_value);
    const ratio = asset.invested_amount / asset.current_value;
    const principalReduction = transferAmount * ratio;

    // Single cashflow entry for the withdrawal; transfer_type marks it as asset→wallet
    await db.insert(investmentCashFlows).values({
      asset_id: item.from_asset_id,
      amount: -principalReduction,
      date: item.next_date,
      wallet_id: item.wallet_id,
      description: desc,
      transfer_type: "asset_to_wallet",
    });

    await db.insert(assetValueSnapshots).values({
      asset_id: item.from_asset_id,
      value: asset.current_value - transferAmount,
      snapshot_date: item.next_date,
    });
  }
}

// @service: daily-log
export async function createDailyLogs(db: DrizzleDb): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const allUsers = await db.select({ id: users.id }).from(users);

  Logger.info({
    correlationId: "cron",
    logCategory: AppConstants.LOG_CATEGORIES.CRON,
    logAction: "CreateDailyLogs",
    message: `Creating daily logs for ${allUsers.length} users`,
    metadata: { today },
  });

  for (const user of allUsers) {
    await DailyLogDAL.createIfNotExists({ userId: user.id, date: today }, db);
  }
}

// ── Helper: get Monday of a given date string ─────────────────────────────────
function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const dow = d.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getSundayOf(mondayStr: string): string {
  const d = new Date(mondayStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
}

function computeWeeklyScore(tc: number, el: number, da: number, cf: number): number {
  return Math.round(tc * 0.4 + el * 0.25 + da * 0.25 + cf * 0.1);
}

// ── Weekly Check-In Prompt (every Monday 8am) ─────────────────────────────────
export async function weeklyCheckinPrompt(db: DrizzleDb): Promise<void> {
  const allUsers = await db.select({ id: users.id }).from(users);

  Logger.info({
    correlationId: "cron",
    logCategory: AppConstants.LOG_CATEGORIES.CRON,
    logAction: "WeeklyCheckinPrompt",
    message: `Setting checkin_due for ${allUsers.length} users`,
  });

  for (const user of allUsers) {
    await db
      .update(trajectoryConfig)
      .set({ checkin_due: 1, updated_at: sql`(datetime('now'))` })
      .where(eq(trajectoryConfig.user_id, user.id));
  }
}

// ── Weekly Score Compute + AI Analysis (every Sunday 11pm) ───────────────────
export async function weeklyScoreCompute(db: DrizzleDb, ai: Ai): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = getMondayOf(today);
  const weekEnd = getSundayOf(weekStart);

  const allUsers = await db.select({ id: users.id }).from(users);

  Logger.info({
    correlationId: "cron",
    logCategory: AppConstants.LOG_CATEGORIES.CRON,
    logAction: "WeeklyScoreCompute",
    message: `Computing weekly score for ${allUsers.length} users`,
    metadata: { weekStart, weekEnd },
  });

  for (const user of allUsers) {
    try {
      // Get trajectory tasks due/active this week
      const trajectoryTasks = await db
        .select({ status: questTasks.status, phase_tag: questTasks.phase_tag })
        .from(questTasks)
        .innerJoin(quests, eq(questTasks.quest_id, quests.id))
        .where(
          and(
            eq(quests.user_id, user.id),
            sql`${quests.deleted_at} IS NULL`,
            sql`${questTasks.phase_tag} IS NOT NULL`,
          ),
        );

      // Task completion score
      const totalTasks = trajectoryTasks.length;
      const doneTasks = trajectoryTasks.filter((t) => t.status === "done").length;
      const taskScore = totalTasks === 0 ? 50 : Math.round((doneTasks / totalTasks) * 100);

      // Elimination score from elimination_items
      const elimItems = await db
        .select({ result: sql<string>`result` })
        .from(sql`elimination_items`)
        .where(
          and(
            sql`user_id = ${user.id}`,
            sql`week_start = ${weekStart}`,
          ),
        );
      const elimTotal = elimItems.length;
      const elimStopped = elimItems.filter((e) => e.result === "stopped").length;
      const elimPartial = elimItems.filter((e) => e.result === "partial").length;
      const eliminationScore = elimTotal === 0
        ? 50
        : Math.round(((elimStopped + elimPartial * 0.5) / elimTotal) * 100);

      // Decision alignment score from decision_logs
      const decisions = await db
        .select({ alignment: sql<string>`alignment` })
        .from(sql`decision_logs`)
        .where(
          and(
            sql`user_id = ${user.id}`,
            sql`week_start = ${weekStart}`,
          ),
        );
      const decTotal = decisions.length;
      const decAligned = decisions.filter((d) => d.alignment === "aligned").length;
      const decMisaligned = decisions.filter((d) => d.alignment === "misaligned").length;
      const decisionScore = decTotal === 0
        ? 50
        : Math.round(((decAligned - decMisaligned * 0.5) / decTotal) * 100);

      // Confidence score from daily pulse data (approximated from habit extractions)
      const habitExtractions = await db
        .select({ date: habitLogExtractions.date, occurred: habitLogExtractions.occurred })
        .from(habitLogExtractions)
        .where(
          and(
            eq(habitLogExtractions.user_id, user.id),
            gte(habitLogExtractions.date, weekStart),
            lte(habitLogExtractions.date, weekEnd),
          ),
        );
      const uniquePulseDays = new Set(habitExtractions.map((h) => h.date)).size;
      const confidenceScore = uniquePulseDays === 0
        ? 50
        : Math.min(100, Math.round((uniquePulseDays / 7) * 100 * 0.5 + taskScore * 0.5));

      const weeklyScore = computeWeeklyScore(taskScore, eliminationScore, decisionScore, confidenceScore);

      // Get daily logs for AI narrative
      const weekDailyLogs = await db
        .select({ content: dailyLogs.content, date: dailyLogs.date })
        .from(dailyLogs)
        .where(
          and(
            eq(dailyLogs.user_id, user.id),
            gte(dailyLogs.date, weekStart),
            lte(dailyLogs.date, weekEnd),
          ),
        );

      // Generate AI analysis using Workers AI
      const logsText = weekDailyLogs
        .filter((l) => l.content && l.content.length > 10)
        .map((l) => `${l.date}: ${l.content}`)
        .join("\n\n");

      let aiAnalysis: string | null = null;
      let aiModelVersion: string | null = null;

      if (logsText) {
        try {
          const prompt = `You are a productivity coach analyzing a user's week. Based on the daily logs below, generate a structured weekly analysis JSON.

Daily Logs:
${logsText.slice(0, 3000)}

Scores computed:
- Task Completion: ${taskScore}/100
- Elimination: ${eliminationScore}/100
- Decision Alignment: ${decisionScore}/100
- Confidence: ${confidenceScore}/100
- Weekly Score: ${weeklyScore}/100

Return ONLY valid JSON in this exact shape:
{
  "narrative": "2-3 sentence narrative of the week",
  "task_highlights": ["key task wins or misses"],
  "elimination_highlights": ["what they eliminated or failed to eliminate"],
  "decision_highlights": ["key decisions detected"],
  "improvement_suggestion": "one specific actionable suggestion for next week"
}`;

          const aiResponse = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [{ role: "user", content: prompt }],
            max_tokens: 500,
          }) as { response?: string };

          const rawText = aiResponse?.response ?? "";
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            JSON.parse(jsonMatch[0]); // validate
            aiAnalysis = jsonMatch[0];
          }
          aiModelVersion = "llama-3.1-8b-instruct";
        } catch {
          Logger.warn({
            correlationId: "cron",
            logCategory: AppConstants.LOG_CATEGORIES.CRON,
            logAction: "WeeklyAIAnalysisFailed",
            message: "AI analysis failed, storing scores without narrative",
            metadata: { userId: user.id },
          });
        }
      }

      const componentScores = JSON.stringify({
        tc: taskScore,
        el: eliminationScore,
        da: decisionScore,
        cf: confidenceScore,
      });

      // Upsert weekly checkin
      await db
        .insert(weeklyCheckins)
        .values({
          user_id: user.id,
          week_start: weekStart,
          status: WeeklyCheckinStatusEnum.Pending,
          task_completion_score: taskScore,
          elimination_score: eliminationScore,
          decision_alignment_score: decisionScore,
          confidence_score: confidenceScore,
          weekly_score: weeklyScore,
          ai_analysis: aiAnalysis,
          ai_model_version: aiModelVersion,
        })
        .onConflictDoUpdate({
          target: [weeklyCheckins.user_id, weeklyCheckins.week_start],
          set: {
            task_completion_score: taskScore,
            elimination_score: eliminationScore,
            decision_alignment_score: decisionScore,
            confidence_score: confidenceScore,
            weekly_score: weeklyScore,
            ai_analysis: aiAnalysis,
            ai_model_version: aiModelVersion,
            updated_at: sql`(datetime('now'))`,
          },
        });

      // Insert score history (ignore duplicate if already locked)
      try {
        await db.insert(scoreHistory).values({
          user_id: user.id,
          period_type: "weekly",
          period_start: weekStart,
          score: weeklyScore,
          component_scores: componentScores,
        });
      } catch {
        // Score history already exists for this week
      }

      Logger.info({
        correlationId: "cron",
        logCategory: AppConstants.LOG_CATEGORIES.CRON,
        logAction: "WeeklyScoreComputed",
        message: `Weekly score computed for user ${user.id}`,
        metadata: { userId: user.id, weeklyScore, weekStart },
      });
    } catch (err) {
      Logger.error({
        correlationId: "cron",
        logCategory: AppConstants.LOG_CATEGORIES.CRON,
        logAction: "WeeklyScoreComputeError",
        message: `Failed to compute weekly score for user ${user.id}`,
        metadata: { userId: user.id },
        error: err,
      });
    }
  }
}

// ── Missed Check-In Penalty (every Wednesday 9am) ─────────────────────────────
export async function missedCheckinPenalty(db: DrizzleDb): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = getMondayOf(today);

  const dueUsers = await db
    .select({ user_id: trajectoryConfig.user_id })
    .from(trajectoryConfig)
    .where(eq(trajectoryConfig.checkin_due, 1));

  Logger.info({
    correlationId: "cron",
    logCategory: AppConstants.LOG_CATEGORIES.CRON,
    logAction: "MissedCheckinPenalty",
    message: `Checking ${dueUsers.length} users for missed check-ins`,
    metadata: { weekStart },
  });

  for (const row of dueUsers) {
    const existing = await db
      .select({ status: weeklyCheckins.status })
      .from(weeklyCheckins)
      .where(
        and(
          eq(weeklyCheckins.user_id, row.user_id),
          eq(weeklyCheckins.week_start, weekStart),
        ),
      )
      .limit(1);

    const isReviewed = existing[0]?.status === WeeklyCheckinStatusEnum.Reviewed;
    if (isReviewed) {
      // Clear flag — already checked in
      await db
        .update(trajectoryConfig)
        .set({ checkin_due: 0, updated_at: sql`(datetime('now'))` })
        .where(eq(trajectoryConfig.user_id, row.user_id));
      continue;
    }

    // Mark as missed and deduct XP
    await db
      .insert(weeklyCheckins)
      .values({
        user_id: row.user_id,
        week_start: weekStart,
        status: WeeklyCheckinStatusEnum.Missed,
      })
      .onConflictDoUpdate({
        target: [weeklyCheckins.user_id, weeklyCheckins.week_start],
        set: {
          status: WeeklyCheckinStatusEnum.Missed,
          updated_at: sql`(datetime('now'))`,
        },
      });

    // Deduct XP via xp_events
    await db.insert(questXpEvents).values({
      user_id: row.user_id,
      quest_id: null,
      source_type: XpSourceTypeEnum.CheckIn,
      xp: -AppConstants.TRAJECTORY.MISSED_CHECKIN_XP_PENALTY,
    });

    Logger.info({
      correlationId: "cron",
      logCategory: AppConstants.LOG_CATEGORIES.CRON,
      logAction: "MissedCheckinPenaltyApplied",
      message: `Missed check-in penalty applied for user ${row.user_id}`,
      metadata: { userId: row.user_id, weekStart, xp: -AppConstants.TRAJECTORY.MISSED_CHECKIN_XP_PENALTY },
    });
  }
}

// ── Achievement Engine (every Sunday 11pm, after score compute) ───────────────
export async function achievementCheck(db: DrizzleDb): Promise<void> {
  const allUsers = await db.select({ id: users.id }).from(users);

  Logger.info({
    correlationId: "cron",
    logCategory: AppConstants.LOG_CATEGORIES.CRON,
    logAction: "AchievementCheck",
    message: `Checking achievements for ${allUsers.length} users`,
  });

  for (const user of allUsers) {
    try {
      await checkAchievementsForUser(user.id, db);
    } catch (err) {
      Logger.error({
        correlationId: "cron",
        logCategory: AppConstants.LOG_CATEGORIES.CRON,
        logAction: "AchievementCheckError",
        message: `Achievement check failed for user ${user.id}`,
        error: err,
        metadata: { userId: user.id },
      });
    }
  }
}

async function unlockAchievement(userId: string, key: string, db: DrizzleDb): Promise<boolean> {
  // Check if already unlocked
  const existing = await db
    .select({ id: userAchievements.id })
    .from(userAchievements)
    .where(
      and(
        eq(userAchievements.user_id, userId),
        eq(userAchievements.achievement_key, key),
      ),
    )
    .limit(1);

  if (existing.length > 0) return false;

  await db.insert(userAchievements).values({
    user_id: userId,
    achievement_key: key,
  });

  const xp = AppConstants.ACHIEVEMENT_XP[key] ?? 0;
  if (xp > 0) {
    await db.insert(questXpEvents).values({
      user_id: userId,
      quest_id: null,
      source_type: XpSourceTypeEnum.Achievement,
      xp,
    });
  }

  Logger.info({
    correlationId: "cron",
    logCategory: AppConstants.LOG_CATEGORIES.CRON,
    logAction: "AchievementUnlocked",
    message: `Achievement unlocked: ${key} for user ${userId}`,
    metadata: { userId, key, xp },
  });

  return true;
}

async function checkAchievementsForUser(userId: string, db: DrizzleDb): Promise<void> {
  const A = AppConstants.ACHIEVEMENTS;

  // Get recent score history (last 20 weeks)
  const recentScores = await db
    .select()
    .from(scoreHistory)
    .where(and(eq(scoreHistory.user_id, userId), eq(scoreHistory.period_type, "weekly")))
    .orderBy(desc(scoreHistory.period_start))
    .limit(20);

  const latestScore = recentScores[0]?.score ?? null;
  const latestCheckin = await db
    .select()
    .from(weeklyCheckins)
    .where(eq(weeklyCheckins.user_id, userId))
    .orderBy(desc(weeklyCheckins.week_start))
    .limit(1);

  const config = await db
    .select()
    .from(trajectoryConfig)
    .where(eq(trajectoryConfig.user_id, userId))
    .limit(1);

  const cfg = config[0] ?? null;

  // FIRST_CHECKIN — completed at least one weekly check-in
  const reviewedCheckins = await db
    .select({ id: weeklyCheckins.id })
    .from(weeklyCheckins)
    .where(
      and(
        eq(weeklyCheckins.user_id, userId),
        eq(weeklyCheckins.status, WeeklyCheckinStatusEnum.Reviewed),
      ),
    )
    .limit(1);
  if (reviewedCheckins.length > 0) {
    await unlockAchievement(userId, A.FIRST_CHECKIN, db);
  }

  // CHECKIN_STREAK_4 — 4 consecutive reviewed check-ins
  const last4Checkins = await db
    .select({ status: weeklyCheckins.status })
    .from(weeklyCheckins)
    .where(eq(weeklyCheckins.user_id, userId))
    .orderBy(desc(weeklyCheckins.week_start))
    .limit(4);
  if (
    last4Checkins.length >= 4 &&
    last4Checkins.every((c) => c.status === WeeklyCheckinStatusEnum.Reviewed)
  ) {
    await unlockAchievement(userId, A.CHECKIN_STREAK_4, db);
  }

  // WEEKLY_SCORE_70 and WEEKLY_SCORE_90 — current week score thresholds
  if (latestScore !== null) {
    if (latestScore >= 70) await unlockAchievement(userId, A.WEEKLY_SCORE_70, db);
    if (latestScore >= 90) await unlockAchievement(userId, A.WEEKLY_SCORE_90, db);
  }

  // STREAK_4_WEEKS_70 — 4 consecutive weeks >= 70
  if (recentScores.length >= 4 && recentScores.slice(0, 4).every((s) => s.score >= 70)) {
    await unlockAchievement(userId, A.STREAK_4_WEEKS_70, db);
  }

  // VAULT_COMPLETE — has at least one quest in each of the 5 trajectory phases
  const vaultPhases = await db
    .select({ phase: quests.trajectory_phase })
    .from(quests)
    .where(
      and(
        eq(quests.user_id, userId),
        sql`${quests.trajectory_phase} IS NOT NULL`,
        sql`${quests.deleted_at} IS NULL`,
      ),
    );
  const phases = new Set(vaultPhases.map((v) => v.trajectory_phase));
  const requiredPhases = ["five_year", "three_year", "one_year", "quarterly", "weekly"];
  if (requiredPhases.every((p) => phases.has(p as any))) {
    await unlockAchievement(userId, A.VAULT_COMPLETE, db);
  }

  // Escape number achievements
  if (cfg?.escape_number && cfg.escape_number > 0) {
    // Get total invested capital from asset value snapshots
    const assetSnapshots = await db
      .select({ value: assetValueSnapshots.value, asset_id: assetValueSnapshots.asset_id })
      .from(assetValueSnapshots)
      .orderBy(desc(assetValueSnapshots.snapshot_date));

    // Latest snapshot per asset
    const latestByAsset = new Map<number, number>();
    for (const snap of assetSnapshots) {
      if (!latestByAsset.has(snap.asset_id)) {
        latestByAsset.set(snap.asset_id, snap.value);
      }
    }
    const totalInvested = Array.from(latestByAsset.values()).reduce((s, v) => s + v, 0);
    const escapePct = totalInvested / cfg.escape_number;

    if (escapePct >= 0.1) await unlockAchievement(userId, A.ESCAPE_10PCT, db);
    if (escapePct >= 0.25) await unlockAchievement(userId, A.ESCAPE_25PCT, db);
    if (escapePct >= 0.5) await unlockAchievement(userId, A.ESCAPE_50PCT, db);
  }

  // FULL_ALIGNMENT_WEEK — tasks >= 70% + no impulse on this week's data
  const currentCheckin = latestCheckin[0];
  if (
    currentCheckin &&
    (currentCheckin.task_completion_score ?? 0) >= 70 &&
    (currentCheckin.elimination_score ?? 0) >= 70 &&
    (currentCheckin.decision_alignment_score ?? 0) >= 70
  ) {
    await unlockAchievement(userId, A.FULL_ALIGNMENT_WEEK, db);
  }
}

export async function processRecurringTransactions(
  db: DrizzleDb,
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const due = await RecurringTransactionDAL.findDue(today, db);

  Logger.info({
    correlationId: "cron",
    logCategory: AppConstants.LOG_CATEGORIES.CRON,
    logAction: "ProcessRecurringTransactions",
    message: `Found ${due.length} due recurring transactions`,
    metadata: { today },
  });

  for (const item of due) {
    const endCondition = item.end_condition as RecurringEndConditionEnum;
    const period = item.period as RecurringTransactionPeriodEnum;
    const weekDays: number[] | null = item.week_days
      ? JSON.parse(item.week_days)
      : null;
    const monthEnd = item.month_end === 1;

    // Skip if this item is past its end_date (shouldn't normally happen, but guard anyway)
    if (
      endCondition === RecurringEndConditionEnum.Until &&
      item.end_date &&
      item.next_date > item.end_date
    ) {
      await RecurringTransactionDAL.delete(item.id, db);
      continue;
    }

    // Materialize the transaction
    if (item.type === "expense") {
      await ExpenseDAL.insertOne(
        {
          userId: item.user_id,
          date: item.next_date,
          amount: item.amount,
          currency: "INR",
          categoryId: item.category_id!,
          description: item.description ?? item.name,
          walletId: item.wallet_id!,
        },
        db,
      );
    } else if (item.type === "income") {
      await DepositDAL.insert(
        {
          userId: item.user_id,
          walletId: item.wallet_id!,
          date: item.next_date,
          amount: item.amount,
          currency: "INR",
          categoryId: item.category_id!,
          description: item.description ?? item.name,
        },
        db,
      );
    } else if (item.type === "transfer") {
      await materializeTransfer(item, db);
    }

    // Advance or terminate
    if (endCondition === RecurringEndConditionEnum.For) {
      const remaining = (item.occurrences ?? 1) - 1;
      if (remaining <= 0) {
        await RecurringTransactionDAL.delete(item.id, db);
        continue;
      }
      const nextDate = advanceDate(
        item.next_date,
        period,
        item.interval,
        weekDays,
        monthEnd,
      );
      await db
        .update(recurringTransactionItems)
        .set({ next_date: nextDate, occurrences: remaining })
        .where(eq(recurringTransactionItems.id, item.id));
      continue;
    }

    const nextDate = advanceDate(
      item.next_date,
      period,
      item.interval,
      weekDays,
      monthEnd,
    );

    if (
      endCondition === RecurringEndConditionEnum.Until &&
      item.end_date &&
      nextDate > item.end_date
    ) {
      await RecurringTransactionDAL.delete(item.id, db);
    } else {
      await RecurringTransactionDAL.updateNextDate(item.id, nextDate, db);
    }
  }
}

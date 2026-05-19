import { and, eq, gte, lte, sql, desc } from "drizzle-orm";
import { DrizzleDb } from "../db";
import {
  timeLogs,
  timeBuckets,
  expenseLogs,
  foodLogs,
  investmentCashFlows,
  habitLogExtractions,
  dailyLogs,
  budgetCategories,
  budgets,
} from "../db/tables";

export interface HabitWeekParams {
  userId: string;
  from: string; // YYYY-MM-DD (Monday)
  to: string;   // YYYY-MM-DD (Sunday)
}

export class HabitDAL {
  // ── Time-based habits ──────────────────────────────────────────────────────

  static async findDistinctionHours(params: HabitWeekParams, db: DrizzleDb) {
    return db
      .select({
        bucket_id: timeBuckets.id,
        bucket_name: timeBuckets.name,
        is_distraction: timeBuckets.is_distraction,
        started_at: timeLogs.started_at,
        ended_at: timeLogs.ended_at,
      })
      .from(timeLogs)
      .innerJoin(timeBuckets, eq(timeLogs.bucket_id, timeBuckets.id))
      .where(
        and(
          eq(timeBuckets.user_id, params.userId),
          gte(timeLogs.started_at, params.from + "T00:00:00"),
          lte(timeLogs.started_at, params.to + "T23:59:59"),
          sql`${timeLogs.deleted_at} IS NULL`,
          sql`${timeBuckets.deleted_at} IS NULL`,
        ),
      );
  }

  static async findTimeBucketsForUser(userId: string, db: DrizzleDb) {
    return db
      .select()
      .from(timeBuckets)
      .where(
        and(
          eq(timeBuckets.user_id, userId),
          sql`${timeBuckets.deleted_at} IS NULL`,
        ),
      );
  }

  // ── Food-based habits ──────────────────────────────────────────────────────

  static async findFoodLogs(params: HabitWeekParams, db: DrizzleDb) {
    return db
      .select()
      .from(foodLogs)
      .where(
        and(
          eq(foodLogs.user_id, params.userId),
          gte(foodLogs.date, params.from),
          lte(foodLogs.date, params.to),
        ),
      )
      .orderBy(foodLogs.date);
  }

  // ── Money-based habits ─────────────────────────────────────────────────────

  static async findExpenseLogs(params: HabitWeekParams, db: DrizzleDb) {
    return db
      .select({
        id: expenseLogs.id,
        date: expenseLogs.date,
        amount: expenseLogs.amount,
        category_id: expenseLogs.category_id,
        description: expenseLogs.description,
      })
      .from(expenseLogs)
      .where(
        and(
          eq(expenseLogs.user_id, params.userId),
          gte(expenseLogs.date, params.from),
          lte(expenseLogs.date, params.to),
        ),
      );
  }

  static async findBudgetCategoryIds(userId: string, db: DrizzleDb): Promise<number[]> {
    const rows = await db
      .select({ category_id: budgetCategories.category_id })
      .from(budgetCategories)
      .innerJoin(budgets, eq(budgetCategories.budget_id, budgets.id))
      .where(eq(budgets.user_id, userId));
    return rows.map((r) => r.category_id);
  }

  // ── Investment habits ──────────────────────────────────────────────────────

  static async findInvestmentDeposits(params: HabitWeekParams, db: DrizzleDb) {
    return db
      .select({
        amount: investmentCashFlows.amount,
        date: investmentCashFlows.date,
        description: investmentCashFlows.description,
      })
      .from(investmentCashFlows)
      .where(
        and(
          gte(investmentCashFlows.date, params.from),
          lte(investmentCashFlows.date, params.to),
          sql`${investmentCashFlows.amount} > 0`,
          sql`${investmentCashFlows.transfer_type} = 'wallet_to_asset' OR ${investmentCashFlows.transfer_type} IS NULL`,
        ),
      );
  }

  // ── AI habit extractions ───────────────────────────────────────────────────

  static async findHabitExtractions(params: HabitWeekParams, db: DrizzleDb) {
    return db
      .select()
      .from(habitLogExtractions)
      .where(
        and(
          eq(habitLogExtractions.user_id, params.userId),
          gte(habitLogExtractions.date, params.from),
          lte(habitLogExtractions.date, params.to),
        ),
      )
      .orderBy(desc(habitLogExtractions.date));
  }

  static async upsertHabitExtraction(
    data: {
      userId: string;
      dailyLogId: number;
      date: string;
      habitKey: string;
      occurred: boolean;
      sourceText?: string;
      sourceType: "ai" | "manual";
    },
    db: DrizzleDb,
  ) {
    const existing = await db
      .select({ id: habitLogExtractions.id })
      .from(habitLogExtractions)
      .where(
        and(
          eq(habitLogExtractions.user_id, data.userId),
          eq(habitLogExtractions.date, data.date),
          eq(habitLogExtractions.habit_key, data.habitKey),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(habitLogExtractions)
        .set({
          occurred: data.occurred ? 1 : 0,
          source_text: data.sourceText ?? null,
          source_type: data.sourceType,
        })
        .where(eq(habitLogExtractions.id, existing[0].id));
    } else {
      await db.insert(habitLogExtractions).values({
        user_id: data.userId,
        daily_log_id: data.dailyLogId,
        date: data.date,
        habit_key: data.habitKey,
        occurred: data.occurred ? 1 : 0,
        source_text: data.sourceText ?? null,
        source_type: data.sourceType,
      });
    }
  }

  static async findDailyLogsForWeek(params: HabitWeekParams, db: DrizzleDb) {
    return db
      .select()
      .from(dailyLogs)
      .where(
        and(
          eq(dailyLogs.user_id, params.userId),
          gte(dailyLogs.date, params.from),
          lte(dailyLogs.date, params.to),
        ),
      )
      .orderBy(dailyLogs.date);
  }
}

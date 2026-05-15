// @service: daily-log
import { and, between, eq } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { dailyLogs, DailyLog } from "../db/tables";
import {
  GetDailyLogDbRequest,
  UpsertDailyLogDbRequest,
  GetDailyLogsByRangeDbRequest,
  MarkAiProcessedDbRequest,
  CreateDailyLogForUserDbRequest,
} from "../schemas";

export class DailyLogDAL {
  static async getByDate(
    req: GetDailyLogDbRequest,
    db: DrizzleDb,
  ): Promise<DailyLog | null> {
    const rows = await db
      .select()
      .from(dailyLogs)
      .where(
        and(eq(dailyLogs.user_id, req.userId), eq(dailyLogs.date, req.date)),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  static async upsert(
    req: UpsertDailyLogDbRequest,
    db: DrizzleDb,
  ): Promise<DailyLog> {
    const existing = await DailyLogDAL.getByDate(
      { userId: req.userId, date: req.date },
      db,
    );

    if (existing) {
      const updated = await db
        .update(dailyLogs)
        .set({ content: req.content, updated_at: new Date().toISOString() })
        .where(
          and(
            eq(dailyLogs.user_id, req.userId),
            eq(dailyLogs.date, req.date),
          ),
        )
        .returning();
      return updated[0];
    }

    const inserted = await db
      .insert(dailyLogs)
      .values({ user_id: req.userId, date: req.date, content: req.content })
      .returning();
    return inserted[0];
  }

  static async getByDateRange(
    req: GetDailyLogsByRangeDbRequest,
    db: DrizzleDb,
  ): Promise<DailyLog[]> {
    return db
      .select()
      .from(dailyLogs)
      .where(
        and(
          eq(dailyLogs.user_id, req.userId),
          between(dailyLogs.date, req.from, req.to),
        ),
      )
      .orderBy(dailyLogs.date);
  }

  static async listByUser(
    userId: string,
    db: DrizzleDb,
  ): Promise<Pick<DailyLog, "id" | "date" | "ai_processed">[]> {
    return db
      .select({ id: dailyLogs.id, date: dailyLogs.date, ai_processed: dailyLogs.ai_processed })
      .from(dailyLogs)
      .where(eq(dailyLogs.user_id, userId))
      .orderBy(dailyLogs.date);
  }

  static async markAiProcessed(
    req: MarkAiProcessedDbRequest,
    db: DrizzleDb,
  ): Promise<void> {
    await db
      .update(dailyLogs)
      .set({ ai_processed: 1, ai_processed_at: req.ai_processed_at })
      .where(
        and(
          eq(dailyLogs.user_id, req.userId),
          eq(dailyLogs.date, req.date),
        ),
      );
  }

  static async createIfNotExists(
    req: CreateDailyLogForUserDbRequest,
    db: DrizzleDb,
  ): Promise<void> {
    await db
      .insert(dailyLogs)
      .values({ user_id: req.userId, date: req.date, content: "" })
      .onConflictDoNothing();
  }
}

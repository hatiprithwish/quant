import { and, between, eq } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { timeLogs } from "../db/schema";
import { InsertTimeLogDbRequest, GetTimeLogsDbRequest } from "../schemas";

export class TimeDAL {
  static async insert(
    req: InsertTimeLogDbRequest,
    db: DrizzleDb,
  ): Promise<number> {
    const result = await db
      .insert(timeLogs)
      .values({
        user_id: req.userId,
        date: req.date,
        bucket: req.bucket,
        activity: req.activity,
        start_time: req.startTime,
        end_time: req.endTime,
      })
      .returning({ id: timeLogs.id });
    return result[0].id;
  }

  static async findByDateRange(req: GetTimeLogsDbRequest, db: DrizzleDb) {
    const conditions = [
      eq(timeLogs.user_id, req.userId),
      between(timeLogs.date, req.from, req.to),
    ];

    if (req.bucket !== null) {
      conditions.push(eq(timeLogs.bucket, req.bucket));
    }

    return db
      .select()
      .from(timeLogs)
      .where(and(...conditions))
      .orderBy(timeLogs.date, timeLogs.start_time);
  }
}

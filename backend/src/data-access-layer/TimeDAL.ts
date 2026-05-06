import { and, between, eq } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { timeLogs, timeBuckets } from "../db/tables";
import { InsertTimeLogDbRequest, GetTimeLogsDbRequest } from "../schemas";
import { AppConstants } from "../config/Constants";

export class TimeDAL {
  static async insertMany(
    items: InsertTimeLogDbRequest[],
    db: DrizzleDb,
  ): Promise<void> {
    const chunkSize = AppConstants.D1_INSERT_CHUNK_SIZES.TIME;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      await db.insert(timeLogs).values(
        chunk.map((req) => ({
          user_id: req.userId,
          date: req.date,
          bucket_id: req.bucket_id,
          activity: req.activity,
          start_time: req.startTime,
          end_time: req.endTime,
        })),
      );
    }
  }

  static async findByDateRange(req: GetTimeLogsDbRequest, db: DrizzleDb) {
    const conditions = [
      eq(timeLogs.user_id, req.userId),
      between(timeLogs.date, req.from, req.to),
    ];

    if (req.bucket_id !== null) {
      conditions.push(eq(timeLogs.bucket_id, req.bucket_id));
    }

    return db
      .select({
        id: timeLogs.id,
        date: timeLogs.date,
        bucket_id: timeLogs.bucket_id,
        bucket_name: timeBuckets.name,
        bucket_color: timeBuckets.color,
        activity: timeLogs.activity,
        start_time: timeLogs.start_time,
        end_time: timeLogs.end_time,
      })
      .from(timeLogs)
      .innerJoin(timeBuckets, eq(timeLogs.bucket_id, timeBuckets.id))
      .where(and(...conditions))
      .orderBy(timeLogs.date, timeLogs.start_time);
  }
}

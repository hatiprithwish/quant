import { and, between, count, eq, isNull, like, sql } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { timeLogs, timeBuckets } from "../db/tables";
import { InsertTimeLogDbRequest, GetTimeLogsDbRequest, UpdateTimeLogDbRequest, GetBucketEntriesDbRequest } from "../schemas";
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
          bucket_id: req.bucket_id,
          activity: req.activity,
          started_at: req.started_at,
          ended_at: req.ended_at,
        })),
      );
    }
  }

  static async insertOne(
    data: {
      user_id: string;
      bucket_id: number;
      activity: string;
      started_at: string;
      ended_at: string;
    },
    db: DrizzleDb,
  ) {
    return db.insert(timeLogs).values(data).returning({ id: timeLogs.id });
  }

  static async update(req: UpdateTimeLogDbRequest, db: DrizzleDb) {
    const patch: Record<string, unknown> = {};
    if (req.bucket_id !== undefined) patch.bucket_id = req.bucket_id;
    if (req.activity !== undefined) patch.activity = req.activity;
    if (req.started_at !== undefined) patch.started_at = req.started_at;
    if (req.ended_at !== undefined) patch.ended_at = req.ended_at;

    return db
      .update(timeLogs)
      .set(patch)
      .where(and(eq(timeLogs.id, req.id), eq(timeLogs.user_id, req.userId), isNull(timeLogs.deleted_at)));
  }

  static async softDelete(id: number, userId: string, db: DrizzleDb) {
    return db
      .update(timeLogs)
      .set({ deleted_at: new Date().toISOString() })
      .where(and(eq(timeLogs.id, id), eq(timeLogs.user_id, userId), isNull(timeLogs.deleted_at)));
  }

  static async findByBucketPaginated(req: GetBucketEntriesDbRequest, db: DrizzleDb) {
    const offset = (req.page - 1) * req.page_size;

    const conditions = [
      eq(timeLogs.user_id, req.userId),
      eq(timeLogs.bucket_id, req.bucket_id),
      isNull(timeLogs.deleted_at),
    ];

    if (req.search) {
      conditions.push(like(timeLogs.activity, `%${req.search}%`));
    }

    const where = and(...conditions);

    const [totalRow, rows] = await Promise.all([
      db.select({ total: count() }).from(timeLogs).where(where),
      db
        .select({
          id: timeLogs.id,
          bucket_id: timeLogs.bucket_id,
          bucket_name: timeBuckets.name,
          bucket_color: timeBuckets.color,
          activity: timeLogs.activity,
          started_at: timeLogs.started_at,
          ended_at: timeLogs.ended_at,
        })
        .from(timeLogs)
        .innerJoin(timeBuckets, eq(timeLogs.bucket_id, timeBuckets.id))
        .where(where)
        .orderBy(sql`${timeLogs.started_at} desc`)
        .limit(req.page_size)
        .offset(offset),
    ]);

    return { rows, total: totalRow[0]?.total ?? 0 };
  }

  static async findByDateRange(req: GetTimeLogsDbRequest, db: DrizzleDb) {
    const conditions = [
      eq(timeLogs.user_id, req.userId),
      between(timeLogs.started_at, `${req.from}T00:00:00`, `${req.to}T23:59:59`),
      isNull(timeLogs.deleted_at),
    ];

    if (req.bucket_id !== null) {
      conditions.push(eq(timeLogs.bucket_id, req.bucket_id));
    }

    return db
      .select({
        id: timeLogs.id,
        bucket_id: timeLogs.bucket_id,
        bucket_name: timeBuckets.name,
        bucket_color: timeBuckets.color,
        activity: timeLogs.activity,
        started_at: timeLogs.started_at,
        ended_at: timeLogs.ended_at,
      })
      .from(timeLogs)
      .innerJoin(timeBuckets, eq(timeLogs.bucket_id, timeBuckets.id))
      .where(and(...conditions))
      .orderBy(timeLogs.started_at);
  }
}

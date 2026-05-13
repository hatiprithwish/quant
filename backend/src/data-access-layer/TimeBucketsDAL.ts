import { and, eq, isNull } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { timeBuckets } from "../db/tables";
import { AppConstants } from "../config/Constants";

export class TimeBucketsDAL {
  static async findByUserId(userId: string, db: DrizzleDb) {
    return db
      .select()
      .from(timeBuckets)
      .where(and(eq(timeBuckets.user_id, userId), isNull(timeBuckets.deleted_at)))
      .orderBy(timeBuckets.id);
  }

  static async insert(
    data: {
      user_id: string;
      name: string;
      color: string;
      is_distraction: number;
      quest_id: string | null;
    },
    db: DrizzleDb,
  ) {
    return db.insert(timeBuckets).values(data).returning({ id: timeBuckets.id });
  }

  static async update(
    bucketId: number,
    userId: string,
    data: {
      name?: string;
      color?: string;
      is_distraction?: number;
      is_archived?: number;
      quest_id?: string | null;
    },
    db: DrizzleDb,
  ) {
    return db
      .update(timeBuckets)
      .set({ ...data, updated_at: new Date().toISOString() })
      .where(and(eq(timeBuckets.id, bucketId), eq(timeBuckets.user_id, userId)));
  }

  static async softDelete(bucketId: number, userId: string, db: DrizzleDb) {
    return db
      .update(timeBuckets)
      .set({ deleted_at: new Date().toISOString() })
      .where(and(eq(timeBuckets.id, bucketId), eq(timeBuckets.user_id, userId)));
  }

  static async insertDefaultBuckets(userId: string, db: DrizzleDb) {
    const P = AppConstants.PALETTE;
    const defaults = [
      { name: "Career", color: P[8], is_distraction: 0 },
      { name: "Sleep", color: P[1], is_distraction: 0 },
      { name: "Maintenance", color: P[9], is_distraction: 0 },
      { name: "Fitness", color: P[7], is_distraction: 0 },
      { name: "Learning", color: P[5], is_distraction: 0 },
      { name: "Social", color: P[2], is_distraction: 0 },
      { name: "Entertainment", color: P[3], is_distraction: 1 },
      { name: "Personal Dev", color: P[0], is_distraction: 0 },
    ];
    await db.insert(timeBuckets).values(
      defaults.map((d) => ({ ...d, user_id: userId, quest_id: null })),
    );
  }
}

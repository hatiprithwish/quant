import { and, eq, isNull } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { timeBuckets } from "../db/tables";

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
    const defaults = [
      { name: "Career", color: "#3b82f6", is_distraction: 0 },
      { name: "Sleep", color: "#8b5cf6", is_distraction: 0 },
      { name: "Maintenance", color: "#6b7280", is_distraction: 0 },
      { name: "Fitness", color: "#10b981", is_distraction: 0 },
      { name: "Learning", color: "#f59e0b", is_distraction: 0 },
      { name: "Social", color: "#ec4899", is_distraction: 0 },
      { name: "Entertainment", color: "#ef4444", is_distraction: 1 },
      { name: "Personal Dev", color: "#06b6d4", is_distraction: 0 },
    ];
    await db.insert(timeBuckets).values(
      defaults.map((d) => ({ ...d, user_id: userId, quest_id: null })),
    );
  }
}

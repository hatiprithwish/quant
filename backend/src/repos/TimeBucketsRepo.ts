import { DrizzleDb } from "../db";
import { TimeBucketsDAL } from "../data-access-layer/TimeBucketsDAL";
import {
  CreateTimeBucketRepoRequest,
  UpdateTimeBucketRepoRequest,
  GetTimeBucketsResponse,
  CreateTimeBucketResponse,
  UpdateTimeBucketResponse,
  DeleteTimeBucketResponse,
} from "../schemas";

export class TimeBucketsRepo {
  static async list(
    req: { userId: string },
    db: DrizzleDb,
  ): Promise<GetTimeBucketsResponse> {
    const rows = await TimeBucketsDAL.findByUserId(req.userId, db);
    return {
      isSuccess: true,
      message: "Buckets retrieved",
      buckets: rows.map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        is_distraction: r.is_distraction === 1,
        quest_id: r.quest_id,
        quest_name: null,
      })),
    };
  }

  static async create(
    req: CreateTimeBucketRepoRequest,
    db: DrizzleDb,
  ): Promise<CreateTimeBucketResponse> {
    const rows = await TimeBucketsDAL.insert(
      {
        user_id: req.userId,
        name: req.name,
        color: req.color,
        is_distraction: req.is_distraction ? 1 : 0,
        quest_id: req.quest_id ?? null,
      },
      db,
    );
    return { isSuccess: true, message: "Bucket created", bucket_id: rows[0].id };
  }

  static async update(
    req: UpdateTimeBucketRepoRequest,
    db: DrizzleDb,
  ): Promise<UpdateTimeBucketResponse> {
    await TimeBucketsDAL.update(
      req.bucketId,
      req.userId,
      {
        name: req.name,
        color: req.color,
        is_distraction: req.is_distraction !== undefined ? (req.is_distraction ? 1 : 0) : undefined,
        quest_id: req.quest_id,
      },
      db,
    );
    return { isSuccess: true, message: "Bucket updated" };
  }

  static async delete(
    req: { bucketId: number; userId: string },
    db: DrizzleDb,
  ): Promise<DeleteTimeBucketResponse> {
    await TimeBucketsDAL.softDelete(req.bucketId, req.userId, db);
    return { isSuccess: true, message: "Bucket deleted" };
  }

  static async ensureDefaultBuckets(userId: string, db: DrizzleDb): Promise<void> {
    const existing = await TimeBucketsDAL.findByUserId(userId, db);
    if (existing.length === 0) {
      await TimeBucketsDAL.insertDefaultBuckets(userId, db);
    }
  }
}

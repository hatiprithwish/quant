import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { TimeBucketsRepo } from "../repos/TimeBucketsRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { ZCreateTimeBucketRequest, ZUpdateTimeBucketRequest } from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const timeBucketsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

timeBucketsRoutes.get(
  "/",
  clerkAuthMiddleware,
  generalRateLimiter,
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const db = getDb(c.env.DB);
    try {
      await TimeBucketsRepo.ensureDefaultBuckets(userId, db);
      const result = await TimeBucketsRepo.list({ userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "GetTimeBucketsSuccess", message: "Time buckets retrieved", metadata: { userId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "GetTimeBucketsFailure", message: "Failed to get time buckets", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

timeBucketsRoutes.post(
  "/",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZCreateTimeBucketRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await TimeBucketsRepo.create({ ...body, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "CreateTimeBucketSuccess", message: "Time bucket created", metadata: { userId, name: body.name } });
      return c.json(result, 201);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "CreateTimeBucketFailure", message: "Failed to create time bucket", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

timeBucketsRoutes.patch(
  "/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZUpdateTimeBucketRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const bucketId = Number(c.req.param("id"));
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    if (isNaN(bucketId)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await TimeBucketsRepo.update({ ...body, bucketId, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "UpdateTimeBucketSuccess", message: "Time bucket updated", metadata: { userId, bucketId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "UpdateTimeBucketFailure", message: "Failed to update time bucket", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

timeBucketsRoutes.delete(
  "/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const bucketId = Number(c.req.param("id"));
    const db = getDb(c.env.DB);
    if (isNaN(bucketId)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await TimeBucketsRepo.delete({ bucketId, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "DeleteTimeBucketSuccess", message: "Time bucket deleted", metadata: { userId, bucketId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "DeleteTimeBucketFailure", message: "Failed to delete time bucket", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

export { timeBucketsRoutes };

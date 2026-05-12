import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { TimeRepo } from "../repos/TimeRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { ZCreateTimeEntryRequest, ZUpdateTimeEntryRequest, ZGetBucketEntriesRequest } from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const timeEntryRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

timeEntryRoutes.get(
  "/",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("query", ZGetBucketEntriesRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const query = c.req.valid("query");
    const db = getDb(c.env.DB);
    try {
      const result = await TimeRepo.getBucketEntries({ ...query, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "GetBucketEntriesSuccess", message: "Bucket entries retrieved", metadata: { userId, bucket_id: query.bucket_id } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "GetBucketEntriesFailure", message: "Failed to get bucket entries", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

timeEntryRoutes.post(
  "/",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZCreateTimeEntryRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await TimeRepo.createEntry({ ...body, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "CreateTimeEntrySuccess", message: "Time entry created", metadata: { userId } });
      return c.json(result, 201);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "CreateTimeEntryFailure", message: "Failed to create time entry", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

timeEntryRoutes.patch(
  "/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZUpdateTimeEntryRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    if (isNaN(id)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await TimeRepo.updateEntry({ ...body, id, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "UpdateTimeEntrySuccess", message: "Time entry updated", metadata: { userId, id } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "UpdateTimeEntryFailure", message: "Failed to update time entry", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

timeEntryRoutes.delete(
  "/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const id = Number(c.req.param("id"));
    const db = getDb(c.env.DB);
    if (isNaN(id)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await TimeRepo.deleteEntry(id, userId, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "DeleteTimeEntrySuccess", message: "Time entry deleted", metadata: { userId, id } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "DeleteTimeEntryFailure", message: "Failed to delete time entry", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

export { timeEntryRoutes };

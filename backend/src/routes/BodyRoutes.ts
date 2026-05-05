import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { BodyMeasurementRepo } from "../repos/BodyMeasurementRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { ZGetBodyMeasurementsRequest } from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const bodyRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /api/query/body/metrics
bodyRoutes.get("/metrics", clerkAuthMiddleware, generalRateLimiter, async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const db = getDb(c.env.DB);
  try {
    const result = await BodyMeasurementRepo.getMetrics(userId, db);
    Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "GetBodyMetricsSuccess", message: "Body metrics retrieved", metadata: { userId } });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "GetBodyMetricsFailure", message: "Failed to get body metrics", error: err });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

// POST /api/query/body/measurements
bodyRoutes.post("/measurements", clerkAuthMiddleware, generalRateLimiter, zValidator("json", ZGetBodyMeasurementsRequest), async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const db = getDb(c.env.DB);
  try {
    const result = await BodyMeasurementRepo.getMeasurements({ ...body, userId }, db);
    if (!result.isSuccess) return c.json(result, 404);
    Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "GetBodyMeasurementsSuccess", message: "Body measurements retrieved", metadata: { userId, metricId: body.metric_id } });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "GetBodyMeasurementsFailure", message: "Failed to get body measurements", error: err });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

export { bodyRoutes };

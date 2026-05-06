import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { BodyMeasurementRepo } from "../repos/BodyMeasurementRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import {
  ZCreateBodyMetricRequest,
  ZUpdateBodyMetricRequest,
  ZCreateBodyMeasurementRequest,
} from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const bodyMutationRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Metric mutations ──────────────────────────────────────────────────────────

bodyMutationRoutes.post(
  "/metric",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZCreateBodyMetricRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await BodyMeasurementRepo.createMetric({ ...body, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "CreateBodyMetricSuccess", message: "Body metric created", metadata: { userId, name: body.name } });
      return c.json(result, 201);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "CreateBodyMetricFailure", message: "Failed to create body metric", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

bodyMutationRoutes.patch(
  "/metric/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZUpdateBodyMetricRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    if (isNaN(id)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await BodyMeasurementRepo.updateMetric({ ...body, userId, id }, db);
      if (!result.isSuccess) return c.json(result, 404);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "UpdateBodyMetricSuccess", message: "Body metric updated", metadata: { userId, id } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "UpdateBodyMetricFailure", message: "Failed to update body metric", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

bodyMutationRoutes.delete(
  "/metric/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const id = Number(c.req.param("id"));
    const db = getDb(c.env.DB);
    if (isNaN(id)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await BodyMeasurementRepo.deleteMetric(id, userId, db);
      if (!result.isSuccess) return c.json(result, 404);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "DeleteBodyMetricSuccess", message: "Body metric deleted", metadata: { userId, id } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "DeleteBodyMetricFailure", message: "Failed to delete body metric", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

// ── Measurement log mutations ──────────────────────────────────────────────────

bodyMutationRoutes.post(
  "/measurement",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZCreateBodyMeasurementRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await BodyMeasurementRepo.createMeasurement({ ...body, userId }, db);
      if (!result.isSuccess) return c.json(result, 404);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "CreateBodyMeasurementSuccess", message: "Body measurement logged", metadata: { userId, metricId: body.metric_id } });
      return c.json(result, 201);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "CreateBodyMeasurementFailure", message: "Failed to log body measurement", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

export { bodyMutationRoutes };

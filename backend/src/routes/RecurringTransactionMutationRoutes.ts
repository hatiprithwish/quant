import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { RecurringTransactionRepo } from "../repos/RecurringTransactionRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import {
  ZCreateRecurringTransactionRequest,
  ZUpdateRecurringTransactionRequest,
} from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const recurringTransactionMutationRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

recurringTransactionMutationRoutes.post(
  "/",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZCreateRecurringTransactionRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await RecurringTransactionRepo.createRecurringTransaction(
        { ...body, userId },
        db,
      );
      Logger.info({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "CreateRecurringTransactionSuccess",
        message: "Recurring transaction created",
        metadata: { userId },
      });
      return c.json(result, 201);
    } catch (err) {
      Logger.error({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
        logAction: "CreateRecurringTransactionFailure",
        message: "Failed to create recurring transaction",
        error: err,
      });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

recurringTransactionMutationRoutes.patch(
  "/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZUpdateRecurringTransactionRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    if (isNaN(id)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await RecurringTransactionRepo.updateRecurringTransaction(
        { ...body, userId, id },
        db,
      );
      if (!result.isSuccess) return c.json(result, 404);
      Logger.info({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "UpdateRecurringTransactionSuccess",
        message: "Recurring transaction updated",
        metadata: { userId, id },
      });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
        logAction: "UpdateRecurringTransactionFailure",
        message: "Failed to update recurring transaction",
        error: err,
      });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

export { recurringTransactionMutationRoutes };

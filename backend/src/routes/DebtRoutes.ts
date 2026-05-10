import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { DebtRepo } from "../repos/DebtRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import {
  ZDebtQueryRequest,
  ZCreateDebtRequest,
  ZUpdateDebtRequest,
  ZAddRepaymentRequest,
} from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const debtRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

debtRoutes.post("/", clerkAuthMiddleware, generalRateLimiter, zValidator("json", ZDebtQueryRequest), async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const db = getDb(c.env.DB);

  try {
    const result = await DebtRepo.getDebts({ userId }, db);
    Logger.info({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.HTTP,
      logAction: "GetDebtsSuccess",
      message: "Debts retrieved",
      metadata: { userId },
    });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
      logAction: "GetDebtsFailure",
      message: "Failed to get debts",
      error: err,
    });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

const debtMutationRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

debtMutationRoutes.post("/", clerkAuthMiddleware, generalRateLimiter, zValidator("json", ZCreateDebtRequest), async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const db = getDb(c.env.DB);
  const body = c.req.valid("json");

  try {
    const result = await DebtRepo.createDebt(userId, body, db);
    Logger.info({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.HTTP,
      logAction: "CreateDebtSuccess",
      message: "Debt created",
      metadata: { userId },
    });
    return c.json(result, 201);
  } catch (err) {
    Logger.error({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
      logAction: "CreateDebtFailure",
      message: "Failed to create debt",
      error: err,
    });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

debtMutationRoutes.put("/:id", clerkAuthMiddleware, generalRateLimiter, zValidator("json", ZUpdateDebtRequest), async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const db = getDb(c.env.DB);
  const id = Number(c.req.param("id"));
  const body = c.req.valid("json");

  try {
    const result = await DebtRepo.updateDebt(userId, id, body, db);
    Logger.info({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.HTTP,
      logAction: "UpdateDebtSuccess",
      message: "Debt updated",
      metadata: { userId, id },
    });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
      logAction: "UpdateDebtFailure",
      message: "Failed to update debt",
      error: err,
    });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

debtMutationRoutes.post("/:id/repayment", clerkAuthMiddleware, generalRateLimiter, zValidator("json", ZAddRepaymentRequest), async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const db = getDb(c.env.DB);
  const debtId = Number(c.req.param("id"));
  const body = c.req.valid("json");

  try {
    const result = await DebtRepo.addRepayment(userId, debtId, body, db);
    Logger.info({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.HTTP,
      logAction: "AddRepaymentSuccess",
      message: "Repayment added",
      metadata: { userId, debtId },
    });
    return c.json(result, 201);
  } catch (err) {
    Logger.error({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
      logAction: "AddRepaymentFailure",
      message: "Failed to add repayment",
      error: err,
    });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

export { debtRoutes, debtMutationRoutes };

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { BudgetRepo } from "../repos/BudgetRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { ZCreateBudgetRequest, ZUpdateBudgetRequest } from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const budgetMutationRoutes = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

budgetMutationRoutes.post(
  "/",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZCreateBudgetRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);

    try {
      const result = await BudgetRepo.createBudget({ ...body, userId }, db);
      Logger.info({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "CreateBudgetSuccess",
        message: "Budget created",
        metadata: { userId, name: body.name },
      });
      return c.json(result, 201);
    } catch (err) {
      Logger.error({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
        logAction: "CreateBudgetFailure",
        message: "Failed to create budget",
        error: err,
      });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

budgetMutationRoutes.patch(
  "/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZUpdateBudgetRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);

    if (isNaN(id))
      return c.json({ isSuccess: false, message: "Invalid id" }, 400);

    try {
      const result = await BudgetRepo.updateBudget({ ...body, userId, id }, db);
      if (!result.isSuccess) return c.json(result, 404);
      Logger.info({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "UpdateBudgetSuccess",
        message: "Budget updated",
        metadata: { userId, id },
      });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
        logAction: "UpdateBudgetFailure",
        message: "Failed to update budget",
        error: err,
      });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

budgetMutationRoutes.delete(
  "/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const id = Number(c.req.param("id"));
    const db = getDb(c.env.DB);

    if (isNaN(id))
      return c.json({ isSuccess: false, message: "Invalid id" }, 400);

    try {
      const result = await BudgetRepo.deleteBudget(id, userId, db);
      if (!result.isSuccess) return c.json(result, 404);
      Logger.info({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "DeleteBudgetSuccess",
        message: "Budget deleted",
        metadata: { userId, id },
      });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
        logAction: "DeleteBudgetFailure",
        message: "Failed to delete budget",
        error: err,
      });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

export { budgetMutationRoutes };

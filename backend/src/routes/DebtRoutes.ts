import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { DebtRepo } from "../repos/DebtRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { ZDebtQueryRequest } from "../schemas";
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

export { debtRoutes };

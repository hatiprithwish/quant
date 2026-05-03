import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { RecurringTransactionRepo } from "../repos/RecurringTransactionRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { ZRecurringTransactionQueryRequest } from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const recurringTransactionRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

recurringTransactionRoutes.post("/", clerkAuthMiddleware, generalRateLimiter, zValidator("json", ZRecurringTransactionQueryRequest), async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const db = getDb(c.env.DB);

  try {
    const result = await RecurringTransactionRepo.getRecurringTransactions({ userId }, db);
    Logger.info({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.HTTP,
      logAction: "GetRecurringTransactionsSuccess",
      message: "Recurring transactions retrieved",
      metadata: { userId },
    });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
      logAction: "GetRecurringTransactionsFailure",
      message: "Failed to get recurring transactions",
      error: err,
    });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

export { recurringTransactionRoutes };

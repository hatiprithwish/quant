import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { ExpenseRepo } from "../repos/ExpenseRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { ZExpenseQueryRequest } from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const expenseRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

expenseRoutes.post("/", clerkAuthMiddleware, generalRateLimiter, zValidator("json", ZExpenseQueryRequest), async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const db = getDb(c.env.DB);

  try {
    const result = await ExpenseRepo.getSummary({ ...body, userId }, db);
    Logger.info({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.HTTP,
      logAction: "GetExpenseSummarySuccess",
      message: "Expense summary retrieved",
      metadata: { userId, from: body.from, to: body.to },
    });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
      logAction: "GetExpenseSummaryFailure",
      message: "Failed to get expense summary",
      error: err,
    });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

export { expenseRoutes };

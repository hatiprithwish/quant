import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { TransactionRepo } from "../repos/TransactionRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { ZTransactionQueryRequest } from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const transactionQueryRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

transactionQueryRoutes.post(
  "/",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZTransactionQueryRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);

    try {
      const result = await TransactionRepo.getTransactions(
        { ...body, userId },
        db,
      );
      Logger.info({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "GetTransactionsSuccess",
        message: "Transactions retrieved",
        metadata: { userId, from: body.from, to: body.to },
      });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
        logAction: "GetTransactionsFailure",
        message: "Failed to get transactions",
        error: err,
      });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

export { transactionQueryRoutes };

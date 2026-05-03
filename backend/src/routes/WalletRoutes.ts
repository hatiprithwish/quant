import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { WalletRepo } from "../repos/WalletRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { ZWalletQueryRequest } from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const walletRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

walletRoutes.post("/", clerkAuthMiddleware, generalRateLimiter, zValidator("json", ZWalletQueryRequest), async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const db = getDb(c.env.DB);

  try {
    const result = await WalletRepo.getWallets({ userId }, db);
    Logger.info({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.HTTP,
      logAction: "GetWalletsSuccess",
      message: "Wallets retrieved",
      metadata: { userId },
    });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
      logAction: "GetWalletsFailure",
      message: "Failed to get wallets",
      error: err,
    });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

export { walletRoutes };

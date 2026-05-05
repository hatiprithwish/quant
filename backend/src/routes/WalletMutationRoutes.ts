import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { WalletRepo } from "../repos/WalletRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import {
  ZCreateWalletRequest,
  ZUpdateWalletRequest,
} from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const walletMutationRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

walletMutationRoutes.post(
  "/",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZCreateWalletRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);

    try {
      const result = await WalletRepo.createWallet({ ...body, userId }, db);
      Logger.info({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "CreateWalletSuccess",
        message: "Wallet created",
        metadata: { userId, name: body.name },
      });
      return c.json(result, 201);
    } catch (err) {
      Logger.error({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
        logAction: "CreateWalletFailure",
        message: "Failed to create wallet",
        error: err,
      });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

walletMutationRoutes.patch(
  "/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZUpdateWalletRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);

    if (isNaN(id)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);

    try {
      const result = await WalletRepo.updateWallet({ ...body, userId, id }, db);
      if (!result.isSuccess) return c.json(result, 404);
      Logger.info({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "UpdateWalletSuccess",
        message: "Wallet updated",
        metadata: { userId, id },
      });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
        logAction: "UpdateWalletFailure",
        message: "Failed to update wallet",
        error: err,
      });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

walletMutationRoutes.get(
  "/:id/record-count",
  clerkAuthMiddleware,
  generalRateLimiter,
  async (c) => {
    const id = Number(c.req.param("id"));
    const db = getDb(c.env.DB);
    if (isNaN(id)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    const result = await WalletRepo.getRecordCount(id, db);
    return c.json(result, 200);
  },
);

walletMutationRoutes.delete(
  "/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const id = Number(c.req.param("id"));
    const db = getDb(c.env.DB);

    if (isNaN(id)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);

    try {
      const result = await WalletRepo.deleteWallet(id, userId, db);
      if (!result.isSuccess) return c.json(result, 404);
      Logger.info({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "DeleteWalletSuccess",
        message: "Wallet soft-deleted",
        metadata: { userId, id },
      });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
        logAction: "DeleteWalletFailure",
        message: "Failed to delete wallet",
        error: err,
      });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

export { walletMutationRoutes };

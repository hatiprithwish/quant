import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { ScratchpadRepo } from "../repos/ScratchpadRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { ZSaveScratchpadRequest } from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const scratchpadRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

scratchpadRoutes.get("/", clerkAuthMiddleware, generalRateLimiter, async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const db = getDb(c.env.DB);

  try {
    const result = await ScratchpadRepo.get(userId, db);
    Logger.info({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.HTTP,
      logAction: "GetScratchpadSuccess",
      message: "Scratchpad retrieved",
      metadata: { userId },
    });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
      logAction: "GetScratchpadFailure",
      message: "Failed to get scratchpad",
      error: err,
    });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

scratchpadRoutes.post(
  "/",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZSaveScratchpadRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);

    try {
      const result = await ScratchpadRepo.save({ ...body, userId }, db);
      Logger.info({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "SaveScratchpadSuccess",
        message: "Scratchpad saved",
        metadata: { userId },
      });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
        logAction: "SaveScratchpadFailure",
        message: "Failed to save scratchpad",
        error: err,
      });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

export { scratchpadRoutes };

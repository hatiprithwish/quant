import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { verifyToken } from "@clerk/backend";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { AuthRepo } from "../repos/AuthRepo";
import { ZAuthSyncRequest } from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { authRateLimiter } from "../middlewares/rateLimiter";

const authRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

authRoutes.post("/sync", authRateLimiter, zValidator("json", ZAuthSyncRequest), async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return c.json({ isSuccess: false, message: "Unauthorized" }, 401);
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    });

    const body = c.req.valid("json");
    const db = getDb(c.env.DB);

    const result = await AuthRepo.syncUser(
      { clerkUserId: payload.sub, email: body.email },
      db,
    );

    Logger.info({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.AUTH,
      logAction: "UserSyncSuccess",
      message: "User synced",
      metadata: { userId: result.userId },
    });

    return c.json(result, 200);
  } catch (err) {
    Logger.error({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.AUTH,
      logAction: "UserSyncFailure",
      message: "User sync failed",
      error: err,
    });
    return c.json({ isSuccess: false, message: "Authentication failed" }, 401);
  }
});

export { authRoutes };

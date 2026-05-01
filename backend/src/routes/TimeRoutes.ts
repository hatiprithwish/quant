import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { TimeRepo } from "../repos/TimeRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { ZTimeQueryRequest } from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const timeRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

timeRoutes.post("/", clerkAuthMiddleware, generalRateLimiter, zValidator("json", ZTimeQueryRequest), async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const db = getDb(c.env.DB);

  try {
    const result = await TimeRepo.getSummary({ ...body, userId }, db);
    Logger.info({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.HTTP,
      logAction: "GetTimeSummarySuccess",
      message: "Time summary retrieved",
      metadata: { userId, from: body.from, to: body.to },
    });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
      logAction: "GetTimeSummaryFailure",
      message: "Failed to get time summary",
      error: err,
    });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

export { timeRoutes };

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { FoodRepo } from "../repos/FoodRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { ZFoodQueryRequest } from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";

const foodRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

foodRoutes.post("/", clerkAuthMiddleware, zValidator("json", ZFoodQueryRequest), async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const body = c.req.valid("json");
  const db = getDb(c.env.DB);

  try {
    const result = await FoodRepo.getSummary({ ...body, userId }, db);
    Logger.info({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.HTTP,
      logAction: "GetFoodSummarySuccess",
      message: "Food summary retrieved",
      metadata: { userId, from: body.from, to: body.to },
    });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
      logAction: "GetFoodSummaryFailure",
      message: "Failed to get food summary",
      error: err,
    });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

export { foodRoutes };

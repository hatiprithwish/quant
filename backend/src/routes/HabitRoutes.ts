import { Hono } from "hono";
import { Env, Variables } from "../types";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { getDb } from "../db";
import { HabitRepo } from "../repos/HabitRepo";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";

export const habitRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
habitRoutes.use("*", clerkAuthMiddleware);

// GET /api/habits?from=YYYY-MM-DD&to=YYYY-MM-DD
habitRoutes.get("/", async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const db = getDb(c.env.DB);

  const from = c.req.query("from");
  const to = c.req.query("to");

  if (!from || !to) {
    return c.json(
      { isSuccess: false, message: "from and to query params required" },
      400,
    );
  }

  Logger.info({
    correlationId,
    logCategory: AppConstants.LOG_CATEGORIES.HTTP,
    logAction: "GetHabits",
    message: "Fetching habit intelligence",
    metadata: { userId, from, to },
  });

  const result = await HabitRepo.getHabits(userId, from, to, db);
  return c.json(result, 200);
});

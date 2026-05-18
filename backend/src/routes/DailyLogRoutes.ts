// @service: daily-log
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { DailyLogRepo } from "../repos/DailyLogRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { generalRateLimiter } from "../middlewares/rateLimiter";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import {
  ZDateParam,
  ZSaveDailyLogRequest,
  ZWeeklyReviewRequest,
  ZCompareDaysRequest,
} from "../schemas";

const dailyLogRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

dailyLogRoutes.use("*", clerkAuthMiddleware, generalRateLimiter);

dailyLogRoutes.get("/:date", zValidator("param", ZDateParam), async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const { date } = c.req.valid("param");
  const db = getDb(c.env.DB);

  try {
    const result = await DailyLogRepo.getByDate(userId, date, db);
    Logger.info({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.HTTP,
      logAction: "GetDailyLogSuccess",
      message: "Daily log retrieved",
      metadata: { userId, date },
    });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
      logAction: "GetDailyLogFailure",
      message: "Failed to get daily log",
      error: err,
    });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

dailyLogRoutes.get("/", async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const db = getDb(c.env.DB);

  try {
    const result = await DailyLogRepo.list(userId, db);
    Logger.info({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.HTTP,
      logAction: "ListDailyLogsSuccess",
      message: "Daily logs listed",
      metadata: { userId },
    });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
      logAction: "ListDailyLogsFailure",
      message: "Failed to list daily logs",
      error: err,
    });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

dailyLogRoutes.patch(
  "/:date",
  zValidator("param", ZDateParam),
  zValidator("json", ZSaveDailyLogRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const { date } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);

    try {
      const result = await DailyLogRepo.save({ ...body, userId, date }, db);
      Logger.info({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "SaveDailyLogSuccess",
        message: "Daily log saved",
        metadata: { userId, date },
      });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
        logAction: "SaveDailyLogFailure",
        message: "Failed to save daily log",
        error: err,
      });
      return c.json(
        { isSuccess: false, message: "Internal server error" },
        500,
      );
    }
  },
);

dailyLogRoutes.post(
  "/:date/analyze",
  zValidator("param", ZDateParam),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const { date } = c.req.valid("param");
    const db = getDb(c.env.DB);

    try {
      const result = await DailyLogRepo.analyzeDailyLog(
        userId,
        date,
        c.env.AI,
        db,
      );
      Logger.info({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "AnalyzeDailyLogSuccess",
        message: "Daily log analyzed",
        metadata: { userId, date },
      });
      return c.json(result, result.isSuccess ? 200 : 400);
    } catch (err) {
      Logger.error({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "AnalyzeDailyLogFailure",
        message: "Failed to analyze daily log",
        error: err,
      });
      return c.json(
        { isSuccess: false, message: "Internal server error" },
        500,
      );
    }
  },
);

dailyLogRoutes.post(
  "/weekly-review",
  zValidator("json", ZWeeklyReviewRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);

    try {
      const result = await DailyLogRepo.weeklyReview(
        { ...body, userId },
        c.env.AI,
        db,
      );
      Logger.info({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "WeeklyReviewSuccess",
        message: "Weekly review generated",
        metadata: { userId, from: body.from, to: body.to },
      });
      return c.json(result, result.isSuccess ? 200 : 400);
    } catch (err) {
      Logger.error({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "WeeklyReviewFailure",
        message: "Failed to generate weekly review",
        error: err,
      });
      return c.json(
        { isSuccess: false, message: "Internal server error" },
        500,
      );
    }
  },
);

dailyLogRoutes.post(
  "/compare",
  zValidator("json", ZCompareDaysRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);

    try {
      const result = await DailyLogRepo.compareDays(
        { ...body, userId },
        c.env.AI,
        db,
      );
      Logger.info({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "CompareDaysSuccess",
        message: "Day comparison generated",
        metadata: { userId, date1: body.date1, date2: body.date2 },
      });
      return c.json(result, result.isSuccess ? 200 : 400);
    } catch (err) {
      Logger.error({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "CompareDaysFailure",
        message: "Failed to compare days",
        error: err,
      });
      return c.json(
        { isSuccess: false, message: "Internal server error" },
        500,
      );
    }
  },
);

export { dailyLogRoutes };

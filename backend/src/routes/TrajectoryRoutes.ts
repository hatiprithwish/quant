import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { TrajectoryRepo } from "../repos/TrajectoryRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { generalRateLimiter } from "../middlewares/rateLimiter";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import {
  ZUpsertTrajectoryConfigRequest,
  ZCreateTrajectoryQuestRequest,
  ZUpdateTrajectoryQuestRequest,
  ZCreateGoalChangeRequest,
  ZConfirmGoalChangeRequest,
  ZCreateEliminationItemRequest,
  ZUpdateEliminationItemRequest,
  ZSubmitCheckinCorrectionRequest,
  ZLockInWeekRequest,
  ZUpdateTaskPhaseTagRequest,
} from "../schemas";

const trajectoryRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
trajectoryRoutes.use("*", clerkAuthMiddleware, generalRateLimiter);

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ZWeekParam = z.object({ week_start: z.string().regex(DATE_REGEX) });
const ZQuestIdParam = z.object({ questId: z.string().min(1) });
const ZItemIdParam = z.object({ itemId: z.string() });
const ZTaskIdParam = z.object({ taskId: z.string() });

// ── Config ──────────────────────────────────────────────────────────────────

trajectoryRoutes.get("/config", async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const db = getDb(c.env.DB);
  try {
    const result = await TrajectoryRepo.getConfig(userId, db);
    Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "GetTrajectoryConfigSuccess", message: "Trajectory config retrieved", metadata: { userId } });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "GetTrajectoryConfigFailure", message: "Failed to get config", error: err });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

trajectoryRoutes.put(
  "/config",
  zValidator("json", ZUpsertTrajectoryConfigRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await TrajectoryRepo.upsertConfig({ ...body, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "UpsertTrajectoryConfigSuccess", message: "Config saved", metadata: { userId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "UpsertTrajectoryConfigFailure", message: "Failed to upsert config", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

// ── Vault ────────────────────────────────────────────────────────────────────

trajectoryRoutes.get("/vault", async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const db = getDb(c.env.DB);
  try {
    const result = await TrajectoryRepo.getVault(userId, db);
    Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "GetVaultSuccess", message: "Vault retrieved", metadata: { userId } });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "GetVaultFailure", message: "Failed to get vault", error: err });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

trajectoryRoutes.post(
  "/vault/quest",
  zValidator("json", ZCreateTrajectoryQuestRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await TrajectoryRepo.createVaultQuest({ ...body, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "CreateVaultQuestSuccess", message: "Vault quest created", metadata: { userId } });
      return c.json(result, result.isSuccess ? 201 : 400);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "CreateVaultQuestFailure", message: "Failed to create vault quest", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

trajectoryRoutes.patch(
  "/vault/quest/:questId",
  zValidator("param", ZQuestIdParam),
  zValidator("json", ZUpdateTrajectoryQuestRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const { questId } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await TrajectoryRepo.updateVaultQuest({ ...body, questId, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "UpdateVaultQuestSuccess", message: "Vault quest updated", metadata: { userId, questId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "UpdateVaultQuestFailure", message: "Failed to update vault quest", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

// ── Goal Change Requests ─────────────────────────────────────────────────────

trajectoryRoutes.post(
  "/goal-change",
  zValidator("json", ZCreateGoalChangeRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await TrajectoryRepo.createGoalChangeRequest({ ...body, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "CreateGoalChangeSuccess", message: "Goal change request created", metadata: { userId } });
      return c.json(result, result.isSuccess ? 201 : 400);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "CreateGoalChangeFailure", message: "Failed to create goal change", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

trajectoryRoutes.post(
  "/goal-change/confirm",
  zValidator("json", ZConfirmGoalChangeRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await TrajectoryRepo.confirmGoalChangeRequest({ ...body, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "ConfirmGoalChangeSuccess", message: "Goal change confirmed", metadata: { userId } });
      return c.json(result, result.isSuccess ? 200 : 400);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "ConfirmGoalChangeFailure", message: "Failed to confirm goal change", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

// ── Elimination Items ─────────────────────────────────────────────────────────

trajectoryRoutes.get(
  "/elimination/:week_start",
  zValidator("param", ZWeekParam),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const { week_start } = c.req.valid("param");
    const db = getDb(c.env.DB);
    try {
      const result = await TrajectoryRepo.getEliminationItems(userId, week_start, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "GetEliminationItemsSuccess", message: "Elimination items retrieved", metadata: { userId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "GetEliminationItemsFailure", message: "Failed to get elimination items", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

trajectoryRoutes.post(
  "/elimination",
  zValidator("json", ZCreateEliminationItemRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await TrajectoryRepo.createEliminationItem({ ...body, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "CreateEliminationItemSuccess", message: "Elimination item created", metadata: { userId } });
      return c.json(result, 201);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "CreateEliminationItemFailure", message: "Failed to create elimination item", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

trajectoryRoutes.patch(
  "/elimination/:itemId",
  zValidator("param", ZItemIdParam),
  zValidator("json", ZUpdateEliminationItemRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const { itemId } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await TrajectoryRepo.updateEliminationItem({ ...body, itemId: Number(itemId), userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "UpdateEliminationItemSuccess", message: "Elimination item updated", metadata: { userId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "UpdateEliminationItemFailure", message: "Failed to update elimination item", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

// ── Weekly Check-In ───────────────────────────────────────────────────────────

trajectoryRoutes.get("/dashboard", async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const db = getDb(c.env.DB);
  try {
    const result = await TrajectoryRepo.getDashboard(userId, db);
    Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "GetTrajectoryDashboardSuccess", message: "Dashboard retrieved", metadata: { userId } });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "GetTrajectoryDashboardFailure", message: "Failed to get dashboard", error: err });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

trajectoryRoutes.get(
  "/checkin/:week_start",
  zValidator("param", ZWeekParam),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const { week_start } = c.req.valid("param");
    const db = getDb(c.env.DB);
    try {
      const result = await TrajectoryRepo.getWeeklyCheckin(userId, week_start, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "GetWeeklyCheckinSuccess", message: "Check-in retrieved", metadata: { userId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "GetWeeklyCheckinFailure", message: "Failed to get check-in", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

trajectoryRoutes.get("/checkins", async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const userId = c.get("userId");
  const db = getDb(c.env.DB);
  try {
    const result = await TrajectoryRepo.getCheckinHistory(userId, 20, 0, db);
    Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "GetCheckinHistorySuccess", message: "Checkin history retrieved", metadata: { userId } });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "GetCheckinHistoryFailure", message: "Failed to get history", error: err });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

trajectoryRoutes.post(
  "/checkin/correct",
  zValidator("json", ZSubmitCheckinCorrectionRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await TrajectoryRepo.submitCheckinCorrection({ ...body, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "SubmitCheckinCorrectionSuccess", message: "Correction submitted", metadata: { userId } });
      return c.json(result, result.isSuccess ? 200 : 400);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "SubmitCheckinCorrectionFailure", message: "Failed to submit correction", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

trajectoryRoutes.post(
  "/checkin/lock",
  zValidator("json", ZLockInWeekRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await TrajectoryRepo.lockInWeek({ ...body, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "LockInWeekSuccess", message: "Week locked in", metadata: { userId } });
      return c.json(result, result.isSuccess ? 200 : 400);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "LockInWeekFailure", message: "Failed to lock in week", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

// ── Task Phase Tag ────────────────────────────────────────────────────────────

trajectoryRoutes.patch(
  "/task/:taskId/phase-tag",
  zValidator("param", ZTaskIdParam),
  zValidator("json", ZUpdateTaskPhaseTagRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const { taskId } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await TrajectoryRepo.updateTaskPhaseTag({ ...body, taskId: Number(taskId), userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "UpdateTaskPhaseTagSuccess", message: "Phase tag updated", metadata: { userId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "UpdateTaskPhaseTagFailure", message: "Failed to update phase tag", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

export { trajectoryRoutes };

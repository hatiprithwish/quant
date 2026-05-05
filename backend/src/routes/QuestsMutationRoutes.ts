import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { QuestsRepo } from "../repos/QuestsRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import {
  ZCreateQuestRequest,
  ZUpdateQuestRequest,
  ZCreateMilestoneRequest,
  ZUpdateMilestoneRequest,
  ZCreateTaskRequest,
  ZUpdateTaskStatusRequest,
} from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const questsMutationRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Quest CRUD ────────────────────────────────────────────────────────────────

questsMutationRoutes.post(
  "/",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZCreateQuestRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await QuestsRepo.createQuest({ ...body, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "CreateQuestSuccess", message: "Quest created", metadata: { userId, name: body.name } });
      return c.json(result, 201);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "CreateQuestFailure", message: "Failed to create quest", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

questsMutationRoutes.patch(
  "/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZUpdateQuestRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const questId = c.req.param("id");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await QuestsRepo.updateQuest({ ...body, questId, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "UpdateQuestSuccess", message: "Quest updated", metadata: { userId, questId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "UpdateQuestFailure", message: "Failed to update quest", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

questsMutationRoutes.delete(
  "/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const questId = c.req.param("id");
    const db = getDb(c.env.DB);
    try {
      const result = await QuestsRepo.deleteQuest({ questId, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "DeleteQuestSuccess", message: "Quest deleted", metadata: { userId, questId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "DeleteQuestFailure", message: "Failed to delete quest", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

// ── Milestone CRUD ────────────────────────────────────────────────────────────

questsMutationRoutes.post(
  "/:id/milestone",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZCreateMilestoneRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const questId = c.req.param("id");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await QuestsRepo.createMilestone({ ...body, questId, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "CreateMilestoneSuccess", message: "Milestone created", metadata: { userId, questId } });
      return c.json(result, 201);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "CreateMilestoneFailure", message: "Failed to create milestone", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

questsMutationRoutes.patch(
  "/milestone/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZUpdateMilestoneRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const milestoneId = Number(c.req.param("id"));
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    if (isNaN(milestoneId)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await QuestsRepo.updateMilestone({ ...body, milestoneId, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "UpdateMilestoneSuccess", message: "Milestone updated", metadata: { userId, milestoneId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "UpdateMilestoneFailure", message: "Failed to update milestone", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

// ── Task CRUD ─────────────────────────────────────────────────────────────────

questsMutationRoutes.post(
  "/:id/task",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZCreateTaskRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const questId = c.req.param("id");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await QuestsRepo.createTask({ ...body, questId, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "CreateTaskSuccess", message: "Task created", metadata: { userId, questId } });
      return c.json(result, 201);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "CreateTaskFailure", message: "Failed to create task", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

questsMutationRoutes.patch(
  "/task/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZUpdateTaskStatusRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const taskId = Number(c.req.param("id"));
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    if (isNaN(taskId)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await QuestsRepo.updateTaskStatus({ ...body, taskId, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "UpdateTaskStatusSuccess", message: "Task status updated", metadata: { userId, taskId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "UpdateTaskStatusFailure", message: "Failed to update task status", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

questsMutationRoutes.delete(
  "/task/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const taskId = Number(c.req.param("id"));
    const db = getDb(c.env.DB);
    if (isNaN(taskId)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await QuestsRepo.deleteTask({ taskId, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "DeleteTaskSuccess", message: "Task deleted", metadata: { userId, taskId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "DeleteTaskFailure", message: "Failed to delete task", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

export { questsMutationRoutes };

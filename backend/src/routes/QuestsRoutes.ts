import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { QuestsRepo } from "../repos/QuestsRepo";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { ZGetQuestsDashboardRequest } from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { generalRateLimiter } from "../middlewares/rateLimiter";

const questsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

questsRoutes.post(
  "/",
  clerkAuthMiddleware,
  generalRateLimiter,
  zValidator("json", ZGetQuestsDashboardRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await QuestsRepo.getDashboard({ ...body, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "GetQuestsDashboardSuccess", message: "Quests dashboard retrieved", metadata: { userId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "GetQuestsDashboardFailure", message: "Failed to get quests dashboard", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

questsRoutes.post(
  "/kanban",
  clerkAuthMiddleware,
  generalRateLimiter,
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const db = getDb(c.env.DB);
    try {
      const result = await QuestsRepo.getKanbanBoard({ userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "GetQuestsKanbanSuccess", message: "Kanban retrieved", metadata: { userId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "GetQuestsKanbanFailure", message: "Failed to get kanban", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

questsRoutes.post(
  "/detail/:id",
  clerkAuthMiddleware,
  generalRateLimiter,
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const userId = c.get("userId");
    const questId = c.req.param("id");
    const db = getDb(c.env.DB);
    try {
      const result = await QuestsRepo.getQuestDetail({ questId, userId }, db);
      Logger.info({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.HTTP, logAction: "GetQuestDetailSuccess", message: "Quest detail retrieved", metadata: { userId, questId } });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId, logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "GetQuestDetailFailure", message: "Failed to get quest detail", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

export { questsRoutes };

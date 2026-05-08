import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { generalRateLimiter } from "../middlewares/rateLimiter";
import { MoneyCategoryRepo } from "../repos/MoneyCategoryRepo";
import {
  ZCreateMoneyCategoryRequest,
  ZUpdateMoneyCategoryRequest,
} from "../schemas";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";

const moneyCategoryRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

moneyCategoryRoutes.use("*", clerkAuthMiddleware);

moneyCategoryRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const db = getDb(c.env.DB);
  const result = await MoneyCategoryRepo.getCategories(userId, db);
  return c.json(result, 200);
});

moneyCategoryRoutes.post(
  "/",
  generalRateLimiter,
  zValidator("json", ZCreateMoneyCategoryRequest),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    try {
      const result = await MoneyCategoryRepo.createCategory({ ...body, userId }, db);
      return c.json(result, 201);
    } catch (err) {
      Logger.error({ correlationId: c.get("correlationId") ?? "unknown", logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "CreateMoneyCategoryFailure", message: "Failed", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

moneyCategoryRoutes.patch(
  "/:id",
  generalRateLimiter,
  zValidator("json", ZUpdateMoneyCategoryRequest),
  async (c) => {
    const userId = c.get("userId");
    const id = Number(c.req.param("id"));
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);
    if (isNaN(id)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
    try {
      const result = await MoneyCategoryRepo.updateCategory({ ...body, userId, id }, db);
      if (!result.isSuccess) return c.json(result, 404);
      return c.json(result, 200);
    } catch (err) {
      Logger.error({ correlationId: c.get("correlationId") ?? "unknown", logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "UpdateMoneyCategoryFailure", message: "Failed", error: err });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

moneyCategoryRoutes.delete("/:id", generalRateLimiter, async (c) => {
  const userId = c.get("userId");
  const id = Number(c.req.param("id"));
  const db = getDb(c.env.DB);
  if (isNaN(id)) return c.json({ isSuccess: false, message: "Invalid id" }, 400);
  try {
    const result = await MoneyCategoryRepo.deleteCategory(id, userId, db);
    if (!result.isSuccess) return c.json(result, 400);
    return c.json(result, 200);
  } catch (err) {
    Logger.error({ correlationId: c.get("correlationId") ?? "unknown", logCategory: AppConstants.LOG_CATEGORIES.DATABASE, logAction: "DeleteMoneyCategoryFailure", message: "Failed", error: err });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

export { moneyCategoryRoutes };

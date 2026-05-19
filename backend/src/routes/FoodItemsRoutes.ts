import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { Env, Variables } from "../types";
import { getDb } from "../db";
import { FoodItemsDAL } from "../data-access-layer/FoodItemsDAL";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth";
import { generalRateLimiter } from "../middlewares/rateLimiter";
import { Logger } from "../config/Logger";
import { AppConstants } from "../config/Constants";
import { ZUpdateFoodItemRequest, FoodItemRow, GetFoodItemsResponse, UpdateFoodItemResponse } from "../schemas";
import { FoodItemReviewStatusEnum, FoodItemSourceEnum } from "../schemas";

const ZIdParam = z.object({ id: z.coerce.number().int().positive() });
const ZStatusQuery = z.object({ status: z.enum(["pending", "approved"]).optional() });

function deserialize(row: {
  id: number;
  name: string;
  keywords: string;
  is_branded: number;
  brand: string | null;
  is_packaged: number;
  ingredients: string | null;
  review_status: FoodItemReviewStatusEnum;
  source: FoodItemSourceEnum;
  calories_per_100g: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  saturated_fat_g: number | null;
  cholesterol_mg: number | null;
  trans_fat_g: number | null;
  potassium_mg: number | null;
  vitamin_a_mcg: number | null;
  vitamin_c_mg: number | null;
  vitamin_d_mcg: number | null;
  vitamin_b12_mcg: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  created_at: string;
  updated_at: string;
}): FoodItemRow {
  return {
    ...row,
    is_branded: row.is_branded === 1,
    is_packaged: row.is_packaged === 1,
    keywords: JSON.parse(row.keywords ?? "[]"),
    ingredients: row.ingredients ? JSON.parse(row.ingredients) : null,
  };
}

const foodItemsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
foodItemsRoutes.use("*", clerkAuthMiddleware, generalRateLimiter);

foodItemsRoutes.get("/", zValidator("query", ZStatusQuery), async (c) => {
  const correlationId = c.get("correlationId") ?? "unknown";
  const { status } = c.req.valid("query");
  const db = getDb(c.env.DB);

  try {
    const rows = status === "pending"
      ? await FoodItemsDAL.findPending(db)
      : await FoodItemsDAL.findAll(db);

    const items = rows.map(deserialize);
    const result: GetFoodItemsResponse = {
      isSuccess: true,
      message: "Food items retrieved",
      items,
      total: items.length,
    };
    Logger.info({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.HTTP,
      logAction: "GetFoodItemsSuccess",
      message: "Food items retrieved",
      metadata: { status, count: items.length },
    });
    return c.json(result, 200);
  } catch (err) {
    Logger.error({
      correlationId,
      logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
      logAction: "GetFoodItemsFailure",
      message: "Failed to retrieve food items",
      error: err,
    });
    return c.json({ isSuccess: false, message: "Internal server error" }, 500);
  }
});

foodItemsRoutes.patch(
  "/:id",
  zValidator("param", ZIdParam),
  zValidator("json", ZUpdateFoodItemRequest),
  async (c) => {
    const correlationId = c.get("correlationId") ?? "unknown";
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDb(c.env.DB);

    try {
      const row = await FoodItemsDAL.update(
        id,
        {
          reviewStatus: body.review_status,
          keywords: body.keywords,
          brand: body.brand ?? undefined,
          caloriesPer100g: body.calories_per_100g,
          proteinG: body.protein_g,
          carbG: body.carb_g,
          fatG: body.fat_g,
          fiberG: body.fiber_g ?? undefined,
          sugarG: body.sugar_g ?? undefined,
          sodiumMg: body.sodium_mg ?? undefined,
        },
        db,
      );

      if (!row) {
        return c.json({ isSuccess: false, message: "Food item not found" }, 404);
      }

      const result: UpdateFoodItemResponse = {
        isSuccess: true,
        message: "Food item updated",
        item: deserialize(row),
      };
      Logger.info({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.HTTP,
        logAction: "UpdateFoodItemSuccess",
        message: "Food item updated",
        metadata: { id },
      });
      return c.json(result, 200);
    } catch (err) {
      Logger.error({
        correlationId,
        logCategory: AppConstants.LOG_CATEGORIES.DATABASE,
        logAction: "UpdateFoodItemFailure",
        message: "Failed to update food item",
        error: err,
      });
      return c.json({ isSuccess: false, message: "Internal server error" }, 500);
    }
  },
);

export { foodItemsRoutes };

import { z } from "zod";
import { ZMealTypeLabelEnum, FoodItemReviewStatusEnum } from "./FoodEnum";

export const ZFoodItemInput = z.object({
  name: z.string().min(1),
  calories: z.number().int().min(0),
  amount: z.number().positive().optional(),
  unit: z.string().optional(),
  protein_g: z.number().min(0).optional(),
  carb_g: z.number().min(0).optional(),
  fat_g: z.number().min(0).optional(),
});

export const ZLogMealRequest = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meal_type: ZMealTypeLabelEnum,
  items: z.array(ZFoodItemInput).min(1),
});
export type LogMealRequest = z.infer<typeof ZLogMealRequest>;

export type LogMealRepoRequest = LogMealRequest & { userId: string };

export const ZFoodQueryRequest = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type FoodQueryRequest = z.infer<typeof ZFoodQueryRequest>;

export type FoodQueryRepoRequest = FoodQueryRequest & { userId: string };

export const ZUpdateFoodItemRequest = z.object({
  review_status: z.nativeEnum(FoodItemReviewStatusEnum).optional(),
  keywords: z.array(z.string()).optional(),
  brand: z.string().nullable().optional(),
  calories_per_100g: z.number().min(0).optional(),
  protein_g: z.number().min(0).optional(),
  carb_g: z.number().min(0).optional(),
  fat_g: z.number().min(0).optional(),
  fiber_g: z.number().min(0).nullable().optional(),
  sugar_g: z.number().min(0).nullable().optional(),
  sodium_mg: z.number().min(0).nullable().optional(),
});
export type UpdateFoodItemRequest = z.infer<typeof ZUpdateFoodItemRequest>;

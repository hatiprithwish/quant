import { ApiResponse } from "../common";
import { AppConstants } from "@/config/Constants";

export enum FoodItemReviewStatusEnum {
  Pending = "pending",
  Approved = "approved",
}

export enum FoodItemSourceEnum {
  USDA = "usda",
  OpenFoodFacts = "openfoodfacts",
  Browser = "browser",
  AiEstimated = "ai_estimated",
}

export interface FoodItemRow {
  id: number;
  name: string;
  keywords: string[];
  is_branded: boolean;
  brand: string | null;
  is_packaged: boolean;
  ingredients: string[] | null;
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
}

export interface GetFoodItemsResponse extends ApiResponse {
  items: FoodItemRow[];
  total: number;
}

export interface UpdateFoodItemResponse extends ApiResponse {
  item: FoodItemRow;
}

export interface UpdateFoodItemInput {
  review_status?: FoodItemReviewStatusEnum;
  keywords?: string[];
  brand?: string | null;
  calories_per_100g?: number;
  protein_g?: number;
  carb_g?: number;
  fat_g?: number;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
}

export enum MealTypeLabelEnum {
  Breakfast = "breakfast",
  Lunch = "lunch",
  Dinner = "dinner",
  Snack = "snack",
}

export const mealTypeDisplayLabel: Record<MealTypeLabelEnum, string> = {
  [MealTypeLabelEnum.Breakfast]: "Breakfast",
  [MealTypeLabelEnum.Lunch]: "Lunch",
  [MealTypeLabelEnum.Dinner]: "Dinner",
  [MealTypeLabelEnum.Snack]: "Snack",
};

const P = AppConstants.PALETTE;
export const mealTypeColor: Record<MealTypeLabelEnum, string> = {
  [MealTypeLabelEnum.Breakfast]: P[5],
  [MealTypeLabelEnum.Lunch]: P[7],
  [MealTypeLabelEnum.Dinner]: P[1],
  [MealTypeLabelEnum.Snack]: P[2],
};

export interface FoodItem {
  name: string;
  calories: number;
  amount?: number;
  unit?: string;
  protein_g?: number;
  carb_g?: number;
  fat_g?: number;
}

export interface MealSummary {
  date: string;
  meal_type: MealTypeLabelEnum;
  total_calories: number;
  total_protein_g: number;
  total_carb_g: number;
  total_fat_g: number;
  items: FoodItem[];
}

export interface DailyFoodSummary {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carb_g: number;
  total_fat_g: number;
  meals: MealSummary[];
}

export interface GetFoodSummaryResponse extends ApiResponse {
  days: DailyFoodSummary[];
  totalCalories: number;
  totalProtein_g: number;
  totalCarb_g: number;
  totalFat_g: number;
}

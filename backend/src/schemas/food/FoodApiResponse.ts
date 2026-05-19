import { ApiResponse } from "../common";
import { DailyFoodSummary } from "./FoodCommon";
import { FoodItemReviewStatusEnum, FoodItemSourceEnum } from "./FoodEnum";

export interface LogMealResponse extends ApiResponse {
  insertedCount: number;
}

export interface GetFoodSummaryResponse extends ApiResponse {
  days: DailyFoodSummary[];
  totalCalories: number;
  totalProtein_g: number;
  totalCarb_g: number;
  totalFat_g: number;
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

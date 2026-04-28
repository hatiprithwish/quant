import { ApiResponse } from "../common";
import { DailyFoodSummary } from "./FoodCommon";

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

import { ApiResponse } from "../common";
import { AppConstants } from "@/config/Constants";

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

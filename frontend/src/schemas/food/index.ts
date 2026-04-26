import { ApiResponse } from "../common";

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

export const mealTypeColor: Record<MealTypeLabelEnum, string> = {
  [MealTypeLabelEnum.Breakfast]: "#f59e0b",
  [MealTypeLabelEnum.Lunch]: "#10b981",
  [MealTypeLabelEnum.Dinner]: "#6366f1",
  [MealTypeLabelEnum.Snack]: "#ec4899",
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

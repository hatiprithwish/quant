import { MealTypeLabelEnum, MealTypeIntEnum } from "./FoodEnum";

export interface FoodItem {
  name: string;
  calories: number;
  amount?: number;
  unit?: string;
  protein_g?: number;
  carb_g?: number;
  fat_g?: number;
}

export interface FoodLogRow {
  id: number;
  user_id: string;
  date: string;
  meal_type: MealTypeIntEnum;
  item_name: string;
  amount: number | null;
  unit: string | null;
  calories: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  created_at: string;
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

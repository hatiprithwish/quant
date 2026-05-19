import { FoodItemReviewStatusEnum, FoodItemSourceEnum, MealTypeIntEnum } from "./FoodEnum";

export interface InsertFoodLogDbRequest {
  userId: string;
  date: string;
  mealType: MealTypeIntEnum;
  itemName: string;
  amount: number | null;
  unit: string | null;
  calories: number;
  proteinG: number;
  carbG: number;
  fatG: number;
}

export interface GetFoodLogsDbRequest {
  userId: string;
  from: string;
  to: string;
}

export interface InsertFoodItemDbRequest {
  name: string;
  keywords: string[];
  isBranded: boolean;
  brand: string | null;
  isPackaged: boolean;
  ingredients: string[] | null;
  reviewStatus: FoodItemReviewStatusEnum;
  source: FoodItemSourceEnum;
  caloriesPer100g: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  saturatedFatG: number | null;
  cholesterolMg: number | null;
  transFatG: number | null;
  potassiumMg: number | null;
  vitaminAMcg: number | null;
  vitaminCMg: number | null;
  vitaminDMcg: number | null;
  vitaminB12Mcg: number | null;
  calciumMg: number | null;
  ironMg: number | null;
}

export interface UpdateFoodItemDbRequest {
  reviewStatus?: FoodItemReviewStatusEnum;
  keywords?: string[];
  brand?: string | null;
  caloriesPer100g?: number;
  proteinG?: number;
  carbG?: number;
  fatG?: number;
  fiberG?: number | null;
  sugarG?: number | null;
  sodiumMg?: number | null;
}

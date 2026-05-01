import { MealTypeIntEnum } from "./FoodEnum";

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

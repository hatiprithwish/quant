import { z } from "zod";

export enum MealTypeIntEnum {
  Breakfast = 1,
  Lunch = 2,
  Dinner = 3,
  Snack = 4,
}
export const ZMealTypeIntEnum = z.nativeEnum(MealTypeIntEnum);

export enum MealTypeLabelEnum {
  Breakfast = "breakfast",
  Lunch = "lunch",
  Dinner = "dinner",
  Snack = "snack",
}
export const ZMealTypeLabelEnum = z.nativeEnum(MealTypeLabelEnum);

export const mealTypeIntToLabel: Record<MealTypeIntEnum, MealTypeLabelEnum> = {
  [MealTypeIntEnum.Breakfast]: MealTypeLabelEnum.Breakfast,
  [MealTypeIntEnum.Lunch]: MealTypeLabelEnum.Lunch,
  [MealTypeIntEnum.Dinner]: MealTypeLabelEnum.Dinner,
  [MealTypeIntEnum.Snack]: MealTypeLabelEnum.Snack,
};

export const mealTypeLabelToInt: Record<MealTypeLabelEnum, MealTypeIntEnum> = {
  [MealTypeLabelEnum.Breakfast]: MealTypeIntEnum.Breakfast,
  [MealTypeLabelEnum.Lunch]: MealTypeIntEnum.Lunch,
  [MealTypeLabelEnum.Dinner]: MealTypeIntEnum.Dinner,
  [MealTypeLabelEnum.Snack]: MealTypeIntEnum.Snack,
};

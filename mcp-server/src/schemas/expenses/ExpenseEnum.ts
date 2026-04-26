import { z } from "zod";

export enum ExpenseCategoryIntEnum {
  FoodGroceries = 1,
  EatingOut = 2,
  Transport = 3,
  Shopping = 4,
  Entertainment = 5,
  Health = 6,
  Subscriptions = 7,
  Utilities = 8,
  Other = 9,
}
export const ZExpenseCategoryIntEnum = z.nativeEnum(ExpenseCategoryIntEnum);

export enum ExpenseCategoryLabelEnum {
  FoodGroceries = "food-groceries",
  EatingOut = "eating-out",
  Transport = "transport",
  Shopping = "shopping",
  Entertainment = "entertainment",
  Health = "health",
  Subscriptions = "subscriptions",
  Utilities = "utilities",
  Other = "other",
}
export const ZExpenseCategoryLabelEnum = z.nativeEnum(ExpenseCategoryLabelEnum);

export const expenseCategoryIntToLabel: Record<
  ExpenseCategoryIntEnum,
  ExpenseCategoryLabelEnum
> = {
  [ExpenseCategoryIntEnum.FoodGroceries]: ExpenseCategoryLabelEnum.FoodGroceries,
  [ExpenseCategoryIntEnum.EatingOut]: ExpenseCategoryLabelEnum.EatingOut,
  [ExpenseCategoryIntEnum.Transport]: ExpenseCategoryLabelEnum.Transport,
  [ExpenseCategoryIntEnum.Shopping]: ExpenseCategoryLabelEnum.Shopping,
  [ExpenseCategoryIntEnum.Entertainment]: ExpenseCategoryLabelEnum.Entertainment,
  [ExpenseCategoryIntEnum.Health]: ExpenseCategoryLabelEnum.Health,
  [ExpenseCategoryIntEnum.Subscriptions]: ExpenseCategoryLabelEnum.Subscriptions,
  [ExpenseCategoryIntEnum.Utilities]: ExpenseCategoryLabelEnum.Utilities,
  [ExpenseCategoryIntEnum.Other]: ExpenseCategoryLabelEnum.Other,
};

export const expenseCategoryLabelToInt: Record<
  ExpenseCategoryLabelEnum,
  ExpenseCategoryIntEnum
> = {
  [ExpenseCategoryLabelEnum.FoodGroceries]: ExpenseCategoryIntEnum.FoodGroceries,
  [ExpenseCategoryLabelEnum.EatingOut]: ExpenseCategoryIntEnum.EatingOut,
  [ExpenseCategoryLabelEnum.Transport]: ExpenseCategoryIntEnum.Transport,
  [ExpenseCategoryLabelEnum.Shopping]: ExpenseCategoryIntEnum.Shopping,
  [ExpenseCategoryLabelEnum.Entertainment]: ExpenseCategoryIntEnum.Entertainment,
  [ExpenseCategoryLabelEnum.Health]: ExpenseCategoryIntEnum.Health,
  [ExpenseCategoryLabelEnum.Subscriptions]: ExpenseCategoryIntEnum.Subscriptions,
  [ExpenseCategoryLabelEnum.Utilities]: ExpenseCategoryIntEnum.Utilities,
  [ExpenseCategoryLabelEnum.Other]: ExpenseCategoryIntEnum.Other,
};

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

export const expenseCategoryColor: Record<ExpenseCategoryLabelEnum, string> = {
  [ExpenseCategoryLabelEnum.FoodGroceries]: "#10b981",
  [ExpenseCategoryLabelEnum.EatingOut]: "#f59e0b",
  [ExpenseCategoryLabelEnum.Transport]: "#6366f1",
  [ExpenseCategoryLabelEnum.Shopping]: "#ec4899",
  [ExpenseCategoryLabelEnum.Entertainment]: "#8b5cf6",
  [ExpenseCategoryLabelEnum.Health]: "#ef4444",
  [ExpenseCategoryLabelEnum.Subscriptions]: "#14b8a6",
  [ExpenseCategoryLabelEnum.Utilities]: "#64748b",
  [ExpenseCategoryLabelEnum.Other]: "#9ca3af",
};

export const expenseCategoryDisplayLabel: Record<ExpenseCategoryLabelEnum, string> = {
  [ExpenseCategoryLabelEnum.FoodGroceries]: "Food & Groceries",
  [ExpenseCategoryLabelEnum.EatingOut]: "Eating Out",
  [ExpenseCategoryLabelEnum.Transport]: "Transport",
  [ExpenseCategoryLabelEnum.Shopping]: "Shopping",
  [ExpenseCategoryLabelEnum.Entertainment]: "Entertainment",
  [ExpenseCategoryLabelEnum.Health]: "Health",
  [ExpenseCategoryLabelEnum.Subscriptions]: "Subscriptions",
  [ExpenseCategoryLabelEnum.Utilities]: "Utilities",
  [ExpenseCategoryLabelEnum.Other]: "Other",
};

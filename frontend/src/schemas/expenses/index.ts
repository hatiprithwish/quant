import { ApiResponse } from "../common";

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

export const expenseCategoryColor: Record<ExpenseCategoryLabelEnum, string> = {
  [ExpenseCategoryLabelEnum.FoodGroceries]: "#10b981",
  [ExpenseCategoryLabelEnum.EatingOut]: "#f59e0b",
  [ExpenseCategoryLabelEnum.Transport]: "#6366f1",
  [ExpenseCategoryLabelEnum.Shopping]: "#ec4899",
  [ExpenseCategoryLabelEnum.Entertainment]: "#8b5cf6",
  [ExpenseCategoryLabelEnum.Health]: "#ef4444",
  [ExpenseCategoryLabelEnum.Subscriptions]: "#0ea5e9",
  [ExpenseCategoryLabelEnum.Utilities]: "#14b8a6",
  [ExpenseCategoryLabelEnum.Other]: "#94a3b8",
};

export interface ExpenseRow {
  id: number;
  date: string;
  amount: number;
  currency: string;
  category: ExpenseCategoryLabelEnum;
  description: string | null;
  payment_method: string | null;
}

export interface ExpenseDaySummary {
  date: string;
  total: number;
  items: ExpenseRow[];
}

export interface ExpenseCategorySummary {
  category: ExpenseCategoryLabelEnum;
  total: number;
  count: number;
}

export interface GetExpenseSummaryResponse extends ApiResponse {
  grandTotal: number;
  byDay: ExpenseDaySummary[];
  byCategory: ExpenseCategorySummary[];
}

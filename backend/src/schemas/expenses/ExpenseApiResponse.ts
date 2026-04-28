import { ApiResponse } from "../common";
import { ExpenseCategoryLabelEnum } from "./ExpenseEnum";

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

export interface LogExpenseResponse extends ApiResponse {
  id: number;
}

export interface GetExpenseSummaryResponse extends ApiResponse {
  grandTotal: number;
  byDay: ExpenseDaySummary[];
  byCategory: ExpenseCategorySummary[];
}

import { ApiResponse } from "../common";
import { MoneyCategoryItem } from "../money-categories";

export interface ExpenseRow {
  id: number;
  date: string;
  amount: number;
  currency: string;
  category: MoneyCategoryItem;
  description: string | null;
  wallet_id: number | null;
}

export interface ExpenseDaySummary {
  date: string;
  total: number;
  items: ExpenseRow[];
}

export interface ExpenseCategorySummary {
  category: MoneyCategoryItem;
  total: number;
  count: number;
}

export interface LogExpenseResponse extends ApiResponse {
  insertedCount: number;
}

export interface GetExpenseSummaryResponse extends ApiResponse {
  grandTotal: number;
  byDay: ExpenseDaySummary[];
  byCategory: ExpenseCategorySummary[];
  vsPrevious: number | null;
}

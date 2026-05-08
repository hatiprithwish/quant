import { ApiResponse } from "../common";
import { ExpenseCategoryLabelEnum } from "../expenses";
import { BudgetPeriodEnum } from "./BudgetEnum";

export interface BudgetWithSpent {
  id: number;
  name: string;
  color: string;
  categories: ExpenseCategoryLabelEnum[];
  amount: number;
  spent: number;
  period: BudgetPeriodEnum;
}

export interface GetBudgetsResponse extends ApiResponse {
  budgets: BudgetWithSpent[];
  from: string;
  to: string;
}

export interface CreateBudgetResponse extends ApiResponse {}
export interface UpdateBudgetResponse extends ApiResponse {}
export interface DeleteBudgetResponse extends ApiResponse {}

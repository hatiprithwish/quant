import { ApiResponse } from "../common";
import { ExpenseCategoryLabelEnum } from "../expenses";
import { BudgetPeriodEnum } from "./BudgetEnum";

export interface BudgetWithSpent {
  id: number;
  label: string;
  category: ExpenseCategoryLabelEnum;
  color: string;
  amount: number;
  spent: number;
  period: BudgetPeriodEnum;
}

export interface GetBudgetsResponse extends ApiResponse {
  budgets: BudgetWithSpent[];
  from: string;
  to: string;
}

import { ApiResponse } from "../common";
import { MoneyCategoryItem } from "../money-categories";
import { BudgetPeriodEnum } from "./BudgetEnum";

export interface BudgetWithSpent {
  id: number;
  name: string;
  color: string;
  categories: MoneyCategoryItem[];
  amount: number;
  spent: number;
  period: BudgetPeriodEnum;
}

export interface GetBudgetsResponse extends ApiResponse {
  budgets: BudgetWithSpent[];
  from: string;
  to: string;
}

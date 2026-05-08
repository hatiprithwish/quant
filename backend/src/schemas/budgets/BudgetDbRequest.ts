import { ExpenseCategoryIntEnum } from "../expenses";
import { BudgetPeriodEnum } from "./BudgetEnum";

export interface GetBudgetsDbRequest {
  userId: string;
}

export interface GetCategoryTotalsDbRequest {
  userId: string;
  from: string;
  to: string;
}

export interface CategoryTotal {
  category: ExpenseCategoryIntEnum;
  total: number;
}

export interface InsertBudgetDbRequest {
  userId: string;
  name: string;
  color: string;
  categories: ExpenseCategoryIntEnum[];
  amount: number;
  period: BudgetPeriodEnum;
}

export interface UpdateBudgetDbRequest {
  id: number;
  userId: string;
  name?: string;
  color?: string;
  categories?: ExpenseCategoryIntEnum[];
  amount?: number;
  period?: BudgetPeriodEnum;
}

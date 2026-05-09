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
  category_id: number;
  total: number;
}

export interface InsertBudgetDbRequest {
  userId: string;
  name: string;
  color: string;
  categoryIds: number[];
  amount: number;
  period: BudgetPeriodEnum;
}

export interface UpdateBudgetDbRequest {
  id: number;
  userId: string;
  name?: string;
  color?: string;
  categoryIds?: number[];
  amount?: number;
  period?: BudgetPeriodEnum;
}

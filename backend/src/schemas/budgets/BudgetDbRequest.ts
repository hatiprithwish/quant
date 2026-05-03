import { ExpenseCategoryIntEnum } from "../expenses";

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

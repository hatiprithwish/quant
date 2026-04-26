import { ExpenseCategoryIntEnum } from "./ExpenseEnum";

export interface InsertExpenseDbRequest {
  userId: string;
  date: string;
  amount: number;
  currency: string;
  category: ExpenseCategoryIntEnum;
  description: string | null;
  paymentMethod: string | null;
}

export interface GetExpensesDbRequest {
  userId: string;
  from: string;
  to: string;
  category: ExpenseCategoryIntEnum | null;
}

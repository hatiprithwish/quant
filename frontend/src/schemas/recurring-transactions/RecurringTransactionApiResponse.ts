import { ApiResponse } from "../common";
import { ExpenseCategoryLabelEnum } from "../expenses";
import { RecurringTransactionPeriodEnum } from "./RecurringTransactionEnum";

export interface RecurringTransactionItem {
  id: number;
  name: string;
  amount: number;
  period: RecurringTransactionPeriodEnum;
  category: ExpenseCategoryLabelEnum;
  next_date: string;
}

export interface GetRecurringTransactionsResponse extends ApiResponse {
  items: RecurringTransactionItem[];
}

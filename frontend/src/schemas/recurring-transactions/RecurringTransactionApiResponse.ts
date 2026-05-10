import { ApiResponse } from "../common";
import { MoneyCategoryItem } from "../money-categories";
import {
  RecurringTransactionPeriodEnum,
  RecurringTransactionTypeEnum,
  RecurringEndConditionEnum,
} from "./RecurringTransactionEnum";

export interface RecurringTransactionItem {
  id: number;
  type: RecurringTransactionTypeEnum;
  name: string;
  amount: number;
  period: RecurringTransactionPeriodEnum;
  interval: number;
  week_days: number[] | null;
  month_end: boolean;
  end_condition: RecurringEndConditionEnum;
  end_date: string | null;
  occurrences: number | null;
  category: MoneyCategoryItem | null;
  description: string | null;
  wallet_id: number | null;
  next_date: string;
  to_wallet_id: number | null;
  asset_id: number | null;
  from_asset_id: number | null;
}

export interface GetRecurringTransactionsResponse extends ApiResponse {
  items: RecurringTransactionItem[];
}

export interface CreateRecurringTransactionResponse extends ApiResponse {
  item: RecurringTransactionItem;
}

export interface UpdateRecurringTransactionResponse extends ApiResponse {
  item: RecurringTransactionItem;
}

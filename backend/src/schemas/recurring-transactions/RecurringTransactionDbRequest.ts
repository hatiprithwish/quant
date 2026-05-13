import { RecurringTransactionPeriodEnum, RecurringTransactionTypeEnum, RecurringEndConditionEnum } from "./RecurringTransactionEnum";

export interface GetRecurringTransactionsDbRequest {
  userId: string;
}

export interface CreateRecurringTransactionDbRequest {
  userId: string;
  walletId: number | null;
  type: RecurringTransactionTypeEnum;
  name: string;
  amount: number;
  period: RecurringTransactionPeriodEnum;
  interval: number;
  weekDays: string | null;
  monthEnd: number;
  endCondition: RecurringEndConditionEnum;
  endDate: string | null;
  occurrences: number | null;
  categoryId: number | null;
  description: string | null;
  nextDate: string;
  toWalletId: number | null;
  assetId: number | null;
  fromAssetId: number | null;
}

export interface UpdateRecurringTransactionDbRequest {
  id: number;
  userId: string;
  walletId?: number | null;
  type?: RecurringTransactionTypeEnum;
  name?: string;
  amount?: number;
  period?: RecurringTransactionPeriodEnum;
  interval?: number;
  weekDays?: string | null;
  monthEnd?: number;
  endCondition?: RecurringEndConditionEnum;
  endDate?: string | null;
  occurrences?: number | null;
  categoryId?: number | null;
  description?: string | null;
  nextDate?: string;
  toWalletId?: number | null;
  assetId?: number | null;
  fromAssetId?: number | null;
}

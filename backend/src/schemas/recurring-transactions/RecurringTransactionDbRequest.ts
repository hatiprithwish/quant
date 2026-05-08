import { RecurringTransactionPeriodEnum, RecurringTransactionTypeEnum, RecurringEndConditionEnum } from "./RecurringTransactionEnum";

export interface GetRecurringTransactionsDbRequest {
  userId: string;
}

export interface CreateRecurringTransactionDbRequest {
  userId: string;
  walletId: number;
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
  categoryId: number;
  description: string | null;
  nextDate: string;
}

export interface UpdateRecurringTransactionDbRequest {
  id: number;
  userId: string;
  walletId?: number;
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
  categoryId?: number;
  description?: string | null;
  nextDate?: string;
}

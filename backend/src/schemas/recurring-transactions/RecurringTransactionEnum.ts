import { z } from "zod";

export enum RecurringTransactionPeriodEnum {
  Weekly = "weekly",
  Monthly = "monthly",
  Yearly = "yearly",
}
export const ZRecurringTransactionPeriodEnum = z.nativeEnum(RecurringTransactionPeriodEnum);

export enum RecurringTransactionTypeEnum {
  Expense = "expense",
  Income = "income",
  Transfer = "transfer",
}
export const ZRecurringTransactionTypeEnum = z.nativeEnum(RecurringTransactionTypeEnum);

export enum RecurringEndConditionEnum {
  Forever = "forever",
  Until = "until",
  For = "for",
}
export const ZRecurringEndConditionEnum = z.nativeEnum(RecurringEndConditionEnum);

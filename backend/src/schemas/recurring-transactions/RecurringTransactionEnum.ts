import { z } from "zod";

export enum RecurringTransactionPeriodEnum {
  Weekly = "weekly",
  Monthly = "monthly",
  Quarterly = "quarterly",
  Yearly = "yearly",
}
export const ZRecurringTransactionPeriodEnum = z.nativeEnum(RecurringTransactionPeriodEnum);

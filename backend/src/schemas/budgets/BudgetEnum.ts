import { z } from "zod";

export enum BudgetPeriodEnum {
  Weekly = "weekly",
  Monthly = "monthly",
  Quarterly = "quarterly",
  Yearly = "yearly",
}
export const ZBudgetPeriodEnum = z.nativeEnum(BudgetPeriodEnum);

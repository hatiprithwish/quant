import { z } from "zod";
import { ZExpenseCategoryLabelEnum } from "./ExpenseEnum";

export const ZLogExpenseRequest = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  currency: z.string().default("INR"),
  category: ZExpenseCategoryLabelEnum,
  description: z.string().optional(),
  payment_method: z.string().optional(),
});
export type LogExpenseRequest = z.infer<typeof ZLogExpenseRequest>;

export type LogExpenseRepoRequest = LogExpenseRequest & { userId: string };

export const ZExpenseQueryRequest = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: ZExpenseCategoryLabelEnum.optional(),
});
export type ExpenseQueryRequest = z.infer<typeof ZExpenseQueryRequest>;

export type ExpenseQueryRepoRequest = ExpenseQueryRequest & { userId: string };

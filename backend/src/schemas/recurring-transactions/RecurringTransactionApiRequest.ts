import { z } from "zod";
import {
  ZRecurringTransactionPeriodEnum,
  ZRecurringTransactionTypeEnum,
  ZRecurringEndConditionEnum,
} from "./RecurringTransactionEnum";
import { ZExpenseCategoryLabelEnum } from "../expenses";

export const ZRecurringTransactionQueryRequest = z.object({}).passthrough();
export type RecurringTransactionQueryRequest = Record<string, unknown>;
export interface RecurringTransactionQueryRepoRequest {
  userId: string;
}

export const ZCreateRecurringTransactionRequest = z.object({
  type: ZRecurringTransactionTypeEnum,
  name: z.string().min(1),
  amount: z.number().positive(),
  category: ZExpenseCategoryLabelEnum,
  wallet_id: z.number().int().positive(),
  period: ZRecurringTransactionPeriodEnum,
  interval: z.number().int().positive().default(1),
  week_days: z.array(z.number().int().min(0).max(6)).optional(),
  month_end: z.boolean().default(false),
  end_condition: ZRecurringEndConditionEnum,
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  occurrences: z.number().int().positive().optional(),
  description: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type CreateRecurringTransactionRequest = z.infer<typeof ZCreateRecurringTransactionRequest>;
export type CreateRecurringTransactionRepoRequest = CreateRecurringTransactionRequest & { userId: string };

export const ZUpdateRecurringTransactionRequest = z.object({
  type: ZRecurringTransactionTypeEnum.optional(),
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  category: ZExpenseCategoryLabelEnum.optional(),
  wallet_id: z.number().int().positive().optional(),
  period: ZRecurringTransactionPeriodEnum.optional(),
  interval: z.number().int().positive().optional(),
  week_days: z.array(z.number().int().min(0).max(6)).optional(),
  month_end: z.boolean().optional(),
  end_condition: ZRecurringEndConditionEnum.optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  occurrences: z.number().int().positive().nullable().optional(),
  description: z.string().nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type UpdateRecurringTransactionRequest = z.infer<typeof ZUpdateRecurringTransactionRequest>;
export type UpdateRecurringTransactionRepoRequest = UpdateRecurringTransactionRequest & { userId: string; id: number };

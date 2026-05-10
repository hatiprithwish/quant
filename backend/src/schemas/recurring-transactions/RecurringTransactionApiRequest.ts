import { z } from "zod";
import {
  ZRecurringTransactionPeriodEnum,
  ZRecurringTransactionTypeEnum,
  ZRecurringEndConditionEnum,
} from "./RecurringTransactionEnum";

export const ZRecurringTransactionQueryRequest = z.object({}).passthrough();
export type RecurringTransactionQueryRequest = Record<string, unknown>;
export interface RecurringTransactionQueryRepoRequest {
  userId: string;
}

export const ZCreateRecurringTransactionRequest = z.object({
  type: ZRecurringTransactionTypeEnum,
  name: z.string().min(1),
  amount: z.number().positive(),
  category_id: z.number().int().positive().optional(),
  wallet_id: z.number().int().positive().optional(),
  period: ZRecurringTransactionPeriodEnum,
  interval: z.number().int().positive().default(1),
  week_days: z.array(z.number().int().min(0).max(6)).optional(),
  month_end: z.boolean().default(false),
  end_condition: ZRecurringEndConditionEnum,
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  occurrences: z.number().int().positive().optional(),
  description: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // Transfer-only fields
  to_wallet_id: z.number().int().positive().optional(),
  asset_id: z.number().int().positive().optional(),
  from_asset_id: z.number().int().positive().optional(),
}).refine((d) => {
  if (d.type !== "transfer") return d.category_id !== undefined && d.wallet_id !== undefined;
  return true;
}, { message: "category_id and wallet_id are required for income/expense" });
export type CreateRecurringTransactionRequest = z.infer<typeof ZCreateRecurringTransactionRequest>;
export type CreateRecurringTransactionRepoRequest = CreateRecurringTransactionRequest & { userId: string };

export const ZUpdateRecurringTransactionRequest = z.object({
  type: ZRecurringTransactionTypeEnum.optional(),
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  category_id: z.number().int().positive().nullable().optional(),
  wallet_id: z.number().int().positive().nullable().optional(),
  period: ZRecurringTransactionPeriodEnum.optional(),
  interval: z.number().int().positive().optional(),
  week_days: z.array(z.number().int().min(0).max(6)).optional(),
  month_end: z.boolean().optional(),
  end_condition: ZRecurringEndConditionEnum.optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  occurrences: z.number().int().positive().nullable().optional(),
  description: z.string().nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_wallet_id: z.number().int().positive().nullable().optional(),
  asset_id: z.number().int().positive().nullable().optional(),
  from_asset_id: z.number().int().positive().nullable().optional(),
});
export type UpdateRecurringTransactionRequest = z.infer<typeof ZUpdateRecurringTransactionRequest>;
export type UpdateRecurringTransactionRepoRequest = UpdateRecurringTransactionRequest & { userId: string; id: number };

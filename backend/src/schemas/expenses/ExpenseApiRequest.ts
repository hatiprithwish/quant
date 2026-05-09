import { z } from "zod";

export const ZExpenseEntryInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  currency: z.string().default("INR"),
  category_id: z.number().int().positive(),
  description: z.string().optional(),
  wallet_id: z.number().int().positive().optional(),
});

export const ZLogExpenseRequest = z.object({
  entries: z.array(ZExpenseEntryInput).min(1),
});
export type LogExpenseRequest = z.infer<typeof ZLogExpenseRequest>;
export type LogExpenseRepoRequest = LogExpenseRequest & { userId: string };

export const ZExpenseQueryRequest = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category_id: z.number().int().positive().optional(),
});
export type ExpenseQueryRequest = z.infer<typeof ZExpenseQueryRequest>;
export type ExpenseQueryRepoRequest = ExpenseQueryRequest & { userId: string };

export const ZCreateExpenseRequest = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  currency: z.string().default("INR"),
  category_id: z.number().int().positive(),
  description: z.string().optional(),
  wallet_id: z.number().int().positive(),
});
export type CreateExpenseRequest = z.infer<typeof ZCreateExpenseRequest>;
export type CreateExpenseRepoRequest = CreateExpenseRequest & { userId: string };

export const ZUpdateExpenseRequest = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  category_id: z.number().int().positive().optional(),
  description: z.string().nullable().optional(),
  wallet_id: z.number().int().positive().nullable().optional(),
});
export type UpdateExpenseRequest = z.infer<typeof ZUpdateExpenseRequest>;
export type UpdateExpenseRepoRequest = UpdateExpenseRequest & { userId: string; id: number };

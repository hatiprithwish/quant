import { z } from "zod";
import { DebtTypeEnum } from "./DebtEnum";

export const ZDebtQueryRequest = z.object({}).passthrough();
export type DebtQueryRequest = Record<string, unknown>;
export interface DebtQueryRepoRequest {
  userId: string;
}

export const ZCreateDebtRequest = z.object({
  type: z.nativeEnum(DebtTypeEnum),
  counterparty_name: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().min(1),
  color: z.string().min(1),
  description: z.string().optional(),
  wallet_id: z.number().int().positive(),
});
export type CreateDebtRequest = z.infer<typeof ZCreateDebtRequest>;

export const ZUpdateDebtRequest = z.object({
  counterparty_name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});
export type UpdateDebtRequest = z.infer<typeof ZUpdateDebtRequest>;

export const ZAddRepaymentRequest = z.object({
  amount: z.number().positive(),
  date: z.string().min(1),
  note: z.string().optional(),
  wallet_id: z.number().int().positive(),
});
export type AddRepaymentRequest = z.infer<typeof ZAddRepaymentRequest>;


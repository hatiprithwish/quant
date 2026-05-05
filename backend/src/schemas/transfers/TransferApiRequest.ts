import { z } from "zod";

export const ZCreateTransferRequest = z.object({
  from_wallet_id: z.number().int().positive(),
  to_wallet_id: z.number().int().positive(),
  amount: z.number().positive(),
  currency: z.string().default("INR"),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type CreateTransferRequest = z.infer<typeof ZCreateTransferRequest>;
export type CreateTransferRepoRequest = CreateTransferRequest & { userId: string };

export const ZUpdateTransferRequest = z.object({
  from_wallet_id: z.number().int().positive().optional(),
  to_wallet_id: z.number().int().positive().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  description: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type UpdateTransferRequest = z.infer<typeof ZUpdateTransferRequest>;
export type UpdateTransferRepoRequest = UpdateTransferRequest & { userId: string; id: number };

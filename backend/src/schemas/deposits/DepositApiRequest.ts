import { z } from "zod";
import { ZDepositCategoryEnum } from "../wallets/WalletEnum";

export const ZCreateDepositRequest = z.object({
  wallet_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  currency: z.string().default("INR"),
  category: ZDepositCategoryEnum,
  description: z.string().optional(),
});
export type CreateDepositRequest = z.infer<typeof ZCreateDepositRequest>;
export type CreateDepositRepoRequest = CreateDepositRequest & { userId: string };

export const ZUpdateDepositRequest = z.object({
  wallet_id: z.number().int().positive().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  category: ZDepositCategoryEnum.optional(),
  description: z.string().nullable().optional(),
});
export type UpdateDepositRequest = z.infer<typeof ZUpdateDepositRequest>;
export type UpdateDepositRepoRequest = UpdateDepositRequest & { userId: string; id: number };

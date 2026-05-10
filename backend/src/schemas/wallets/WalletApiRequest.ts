import { z } from "zod";
import { ZWalletTypeEnum } from "./WalletEnum";

export const ZWalletQueryRequest = z.object({}).passthrough();
export type WalletQueryRequest = Record<string, unknown>;
export interface WalletQueryRepoRequest {
  userId: string;
}

export const ZCreateWalletRequest = z.object({
  name: z.string().min(1),
  type: ZWalletTypeEnum,
  credit_limit: z.number().positive().optional(),
  initial_balance: z.number().nonnegative().optional(),
});
export type CreateWalletRequest = z.infer<typeof ZCreateWalletRequest>;
export type CreateWalletRepoRequest = CreateWalletRequest & { userId: string };

export const ZUpdateWalletRequest = z.object({
  name: z.string().min(1).optional(),
  type: ZWalletTypeEnum.optional(),
  credit_limit: z.number().positive().nullable().optional(),
  current_balance: z.number().optional(),
});
export type UpdateWalletRequest = z.infer<typeof ZUpdateWalletRequest>;
export type UpdateWalletRepoRequest = UpdateWalletRequest & { userId: string; id: number };


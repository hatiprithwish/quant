import { z } from "zod";

export const ZCreateInvestmentAccountRequest = z.object({
  name: z.string().min(1),
});
export type CreateInvestmentAccountRequest = z.infer<typeof ZCreateInvestmentAccountRequest>;

export const ZUpdateInvestmentAccountRequest = z.object({
  name: z.string().min(1).optional(),
});
export type UpdateInvestmentAccountRequest = z.infer<typeof ZUpdateInvestmentAccountRequest>;

export const ZCreateInvestmentAssetRequest = z.object({
  name: z.string().min(1),
});
export type CreateInvestmentAssetRequest = z.infer<typeof ZCreateInvestmentAssetRequest>;

export const ZUpdateInvestmentAssetRequest = z.object({
  name: z.string().min(1).optional(),
});
export type UpdateInvestmentAssetRequest = z.infer<typeof ZUpdateInvestmentAssetRequest>;

export const ZAddCashFlowRequest = z.object({
  amount: z.number().positive(),
  date: z.string().min(1),
  wallet_id: z.number().int().positive().optional(),
  description: z.string().optional(),
});
export type AddCashFlowRequest = z.infer<typeof ZAddCashFlowRequest>;

export const ZUpdateAssetValueRequest = z.object({
  value: z.number().nonnegative(),
  snapshot_date: z.string().min(1),
});
export type UpdateAssetValueRequest = z.infer<typeof ZUpdateAssetValueRequest>;

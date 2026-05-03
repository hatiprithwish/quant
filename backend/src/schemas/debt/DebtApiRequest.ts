import { z } from "zod";

export const ZDebtQueryRequest = z.object({}).passthrough();
export type DebtQueryRequest = Record<string, unknown>;
export interface DebtQueryRepoRequest {
  userId: string;
}

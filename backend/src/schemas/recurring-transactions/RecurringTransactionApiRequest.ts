import { z } from "zod";

export const ZRecurringTransactionQueryRequest = z.object({}).passthrough();
export type RecurringTransactionQueryRequest = Record<string, unknown>;
export interface RecurringTransactionQueryRepoRequest {
  userId: string;
}

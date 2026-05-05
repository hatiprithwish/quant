import { z } from "zod";

export const ZTransactionQueryRequest = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type TransactionQueryRequest = z.infer<typeof ZTransactionQueryRequest>;
export type TransactionQueryRepoRequest = TransactionQueryRequest & { userId: string };

import { z } from "zod";
import { ZBudgetPeriodEnum } from "./BudgetEnum";

export const ZBudgetQueryRequest = z.object({
  period: ZBudgetPeriodEnum,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type BudgetQueryRequest = z.infer<typeof ZBudgetQueryRequest>;
export type BudgetQueryRepoRequest = BudgetQueryRequest & { userId: string };

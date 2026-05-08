import { z } from "zod";
import { ZBudgetPeriodEnum } from "./BudgetEnum";
import { ZExpenseCategoryLabelEnum } from "../expenses";

export const ZBudgetQueryRequest = z.object({
  period: ZBudgetPeriodEnum,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type BudgetQueryRequest = z.infer<typeof ZBudgetQueryRequest>;
export type BudgetQueryRepoRequest = BudgetQueryRequest & { userId: string };

export const ZCreateBudgetRequest = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  categories: z.array(ZExpenseCategoryLabelEnum).min(0),
  amount: z.number().positive(),
  period: ZBudgetPeriodEnum,
});
export type CreateBudgetRequest = z.infer<typeof ZCreateBudgetRequest>;
export type CreateBudgetRepoRequest = CreateBudgetRequest & { userId: string };

export const ZUpdateBudgetRequest = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  categories: z.array(ZExpenseCategoryLabelEnum).min(0).optional(),
  amount: z.number().positive().optional(),
  period: ZBudgetPeriodEnum.optional(),
});
export type UpdateBudgetRequest = z.infer<typeof ZUpdateBudgetRequest>;
export type UpdateBudgetRepoRequest = UpdateBudgetRequest & { userId: string; id: number };

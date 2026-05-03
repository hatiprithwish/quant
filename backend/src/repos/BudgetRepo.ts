import { DrizzleDb } from "../db";
import { BudgetDAL } from "../data-access-layer/BudgetDAL";
import {
  BudgetQueryRepoRequest,
  GetBudgetsResponse,
  ExpenseCategoryIntEnum,
  expenseCategoryIntToLabel,
} from "../schemas";
import { computeDateRange } from "../utils/periodUtils";

export class BudgetRepo {
  static async getBudgets(
    req: BudgetQueryRepoRequest,
    db: DrizzleDb,
  ): Promise<GetBudgetsResponse> {
    const { from, to } = computeDateRange(req.period, req.startDate);

    const [budgetRows, categoryTotals] = await Promise.all([
      BudgetDAL.findAll({ userId: req.userId }, db),
      BudgetDAL.getCategoryTotals({ userId: req.userId, from, to }, db),
    ]);

    const spentMap = new Map<ExpenseCategoryIntEnum, number>();
    for (const row of categoryTotals) {
      spentMap.set(row.category, row.total ?? 0);
    }

    return {
      isSuccess: true,
      message: "Budgets retrieved",
      from,
      to,
      budgets: budgetRows.map((b) => ({
        id: b.id,
        label: b.label,
        category: expenseCategoryIntToLabel[b.category],
        color: b.color,
        amount: b.amount,
        period: b.period,
        spent: spentMap.get(b.category) ?? 0,
      })),
    };
  }
}

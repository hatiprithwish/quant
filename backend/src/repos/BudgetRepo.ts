import { DrizzleDb } from "../db";
import { BudgetDAL } from "../data-access-layer/BudgetDAL";
import {
  BudgetQueryRepoRequest,
  CreateBudgetRepoRequest,
  UpdateBudgetRepoRequest,
  GetBudgetsResponse,
  CreateBudgetResponse,
  UpdateBudgetResponse,
  DeleteBudgetResponse,
  ExpenseCategoryIntEnum,
  expenseCategoryIntToLabel,
  expenseCategoryLabelToInt,
} from "../schemas";
import { computeDateRange } from "../utils/periodUtils";

export class BudgetRepo {
  static async getBudgets(
    req: BudgetQueryRepoRequest,
    db: DrizzleDb,
  ): Promise<GetBudgetsResponse> {
    const { from, to } = computeDateRange(req.period, req.startDate);

    const budgetRows = await BudgetDAL.findAll({ userId: req.userId }, db);
    const budgetIds = budgetRows.map((b) => b.id);

    const [categoryRows, categoryTotals] = await Promise.all([
      BudgetDAL.findCategoriesForBudgets(budgetIds, db),
      BudgetDAL.getCategoryTotals({ userId: req.userId, from, to }, db),
    ]);

    const spentMap = new Map<ExpenseCategoryIntEnum, number>();
    for (const row of categoryTotals) {
      spentMap.set(row.category, row.total ?? 0);
    }

    const totalAllCategories = categoryTotals.reduce((sum, r) => sum + (r.total ?? 0), 0);

    const budgetCategoryMap = new Map<number, ExpenseCategoryIntEnum[]>();
    for (const bc of categoryRows) {
      const arr = budgetCategoryMap.get(bc.budget_id) ?? [];
      arr.push(bc.category);
      budgetCategoryMap.set(bc.budget_id, arr);
    }

    return {
      isSuccess: true,
      message: "Budgets retrieved",
      from,
      to,
      budgets: budgetRows.map((b) => {
        const cats = budgetCategoryMap.get(b.id) ?? [];
        const spent =
          cats.length === 0
            ? totalAllCategories
            : cats.reduce((sum, cat) => sum + (spentMap.get(cat) ?? 0), 0);

        return {
          id: b.id,
          name: b.name,
          color: b.color,
          categories: cats.map((c) => expenseCategoryIntToLabel[c]),
          amount: b.amount,
          period: b.period,
          spent,
        };
      }),
    };
  }

  static async createBudget(
    req: CreateBudgetRepoRequest,
    db: DrizzleDb,
  ): Promise<CreateBudgetResponse> {
    const categoryInts = req.categories.map((c) => expenseCategoryLabelToInt[c]);
    await BudgetDAL.insert(
      {
        userId: req.userId,
        name: req.name,
        color: req.color,
        categories: categoryInts,
        amount: req.amount,
        period: req.period,
      },
      db,
    );
    return { isSuccess: true, message: "Budget created" };
  }

  static async updateBudget(
    req: UpdateBudgetRepoRequest,
    db: DrizzleDb,
  ): Promise<UpdateBudgetResponse> {
    const existing = await BudgetDAL.findById(req.id, req.userId, db);
    if (!existing) return { isSuccess: false, message: "Budget not found" };

    const categoryInts = req.categories?.map((c) => expenseCategoryLabelToInt[c]);
    await BudgetDAL.update(
      {
        id: req.id,
        userId: req.userId,
        name: req.name,
        color: req.color,
        categories: categoryInts,
        amount: req.amount,
        period: req.period,
      },
      db,
    );
    return { isSuccess: true, message: "Budget updated" };
  }

  static async deleteBudget(
    id: number,
    userId: string,
    db: DrizzleDb,
  ): Promise<DeleteBudgetResponse> {
    const existing = await BudgetDAL.findById(id, userId, db);
    if (!existing) return { isSuccess: false, message: "Budget not found" };
    await BudgetDAL.delete(id, userId, db);
    return { isSuccess: true, message: "Budget deleted" };
  }
}

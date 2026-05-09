import { DrizzleDb } from "../db";
import { BudgetDAL } from "../data-access-layer/BudgetDAL";
import { MoneyCategoryDAL } from "../data-access-layer/MoneyCategoryDAL";
import {
  BudgetQueryRepoRequest,
  CreateBudgetRepoRequest,
  UpdateBudgetRepoRequest,
  GetBudgetsResponse,
  CreateBudgetResponse,
  UpdateBudgetResponse,
  DeleteBudgetResponse,
  MoneyCategoryItem,
  MoneyCategoryTypeEnum,
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

    const [categoryRows, categoryTotals, allUserCategories] = await Promise.all([
      BudgetDAL.findCategoriesForBudgets(budgetIds, db),
      BudgetDAL.getCategoryTotals({ userId: req.userId, from, to }, db),
      MoneyCategoryDAL.findAll(req.userId, db),
    ]);

    const catItemMap = new Map<number, MoneyCategoryItem>(
      allUserCategories.map((c) => [
        c.id,
        { id: c.id, name: c.name, display_label: c.display_label, color: c.color, type: c.type as MoneyCategoryTypeEnum },
      ]),
    );

    const spentMap = new Map<number, number>();
    for (const row of categoryTotals) {
      spentMap.set(row.category_id, row.total ?? 0);
    }

    const totalAllCategories = categoryTotals.reduce((sum, r) => sum + (r.total ?? 0), 0);

    const budgetCategoryMap = new Map<number, number[]>();
    for (const bc of categoryRows) {
      const arr = budgetCategoryMap.get(bc.budget_id) ?? [];
      arr.push(bc.category_id);
      budgetCategoryMap.set(bc.budget_id, arr);
    }

    return {
      isSuccess: true,
      message: "Budgets retrieved",
      from,
      to,
      budgets: budgetRows.map((b) => {
        const catIds = budgetCategoryMap.get(b.id) ?? [];
        const spent =
          catIds.length === 0
            ? totalAllCategories
            : catIds.reduce((sum, catId) => sum + (spentMap.get(catId) ?? 0), 0);

        return {
          id: b.id,
          name: b.name,
          color: b.color,
          categories: catIds.map((id) => catItemMap.get(id)!).filter(Boolean),
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
    await BudgetDAL.insert(
      {
        userId: req.userId,
        name: req.name,
        color: req.color,
        categoryIds: req.category_ids,
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

    await BudgetDAL.update(
      {
        id: req.id,
        userId: req.userId,
        name: req.name,
        color: req.color,
        categoryIds: req.category_ids,
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

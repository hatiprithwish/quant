import { and, between, eq, inArray, sql } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { budgets, budgetCategories, expenseLogs } from "../db/tables";
import {
  GetBudgetsDbRequest,
  GetCategoryTotalsDbRequest,
  InsertBudgetDbRequest,
  UpdateBudgetDbRequest,
} from "../schemas";

export class BudgetDAL {
  static async findAll(req: GetBudgetsDbRequest, db: DrizzleDb) {
    return db.select().from(budgets).where(eq(budgets.user_id, req.userId));
  }

  static async findCategoriesForBudgets(budgetIds: number[], db: DrizzleDb) {
    if (budgetIds.length === 0) return [];
    return db
      .select()
      .from(budgetCategories)
      .where(inArray(budgetCategories.budget_id, budgetIds));
  }

  static async getCategoryTotals(req: GetCategoryTotalsDbRequest, db: DrizzleDb) {
    return db
      .select({
        category: expenseLogs.category,
        total: sql<number>`SUM(${expenseLogs.amount})`.as("total"),
      })
      .from(expenseLogs)
      .where(
        and(
          eq(expenseLogs.user_id, req.userId),
          between(expenseLogs.date, req.from, req.to),
        ),
      )
      .groupBy(expenseLogs.category);
  }

  static async insert(req: InsertBudgetDbRequest, db: DrizzleDb) {
    const [inserted] = await db
      .insert(budgets)
      .values({
        user_id: req.userId,
        name: req.name,
        color: req.color,
        amount: req.amount,
        period: req.period,
      })
      .returning({ id: budgets.id });

    if (req.categories.length > 0) {
      await db.insert(budgetCategories).values(
        req.categories.map((cat) => ({ budget_id: inserted.id, category: cat })),
      );
    }

    return inserted;
  }

  static async update(req: UpdateBudgetDbRequest, db: DrizzleDb) {
    const budgetFields: Partial<typeof budgets.$inferInsert> = {};
    if (req.name !== undefined) budgetFields.name = req.name;
    if (req.color !== undefined) budgetFields.color = req.color;
    if (req.amount !== undefined) budgetFields.amount = req.amount;
    if (req.period !== undefined) budgetFields.period = req.period;

    if (Object.keys(budgetFields).length > 0) {
      await db
        .update(budgets)
        .set(budgetFields)
        .where(and(eq(budgets.id, req.id), eq(budgets.user_id, req.userId)));
    }

    if (req.categories !== undefined) {
      await db.delete(budgetCategories).where(eq(budgetCategories.budget_id, req.id));
      if (req.categories.length > 0) {
        await db.insert(budgetCategories).values(
          req.categories.map((cat) => ({ budget_id: req.id, category: cat })),
        );
      }
    }
  }

  static async delete(id: number, userId: string, db: DrizzleDb) {
    await db.delete(budgetCategories).where(eq(budgetCategories.budget_id, id));
    return db.delete(budgets).where(and(eq(budgets.id, id), eq(budgets.user_id, userId)));
  }

  static async findById(id: number, userId: string, db: DrizzleDb) {
    const rows = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.user_id, userId)));
    return rows[0] ?? null;
  }
}

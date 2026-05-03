import { and, between, eq, sql } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { budgets, expenseLogs } from "../db/schema";
import { GetBudgetsDbRequest, GetCategoryTotalsDbRequest } from "../schemas";

export class BudgetDAL {
  static async findAll(req: GetBudgetsDbRequest, db: DrizzleDb) {
    return db.select().from(budgets).where(eq(budgets.user_id, req.userId));
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
}

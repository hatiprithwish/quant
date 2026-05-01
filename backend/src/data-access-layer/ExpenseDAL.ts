import { and, between, eq } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { expenseLogs } from "../db/schema";
import { InsertExpenseDbRequest, GetExpensesDbRequest } from "../schemas";

export class ExpenseDAL {
  static async insertMany(
    items: InsertExpenseDbRequest[],
    db: DrizzleDb,
  ): Promise<void> {
    await db.insert(expenseLogs).values(
      items.map((req) => ({
        user_id: req.userId,
        date: req.date,
        amount: req.amount,
        currency: req.currency,
        category: req.category,
        description: req.description,
        payment_method: req.paymentMethod,
      })),
    );
  }

  static async findByDateRange(req: GetExpensesDbRequest, db: DrizzleDb) {
    const conditions = [
      eq(expenseLogs.user_id, req.userId),
      between(expenseLogs.date, req.from, req.to),
    ];

    if (req.category !== null) {
      conditions.push(eq(expenseLogs.category, req.category));
    }

    return db
      .select()
      .from(expenseLogs)
      .where(and(...conditions))
      .orderBy(expenseLogs.date);
  }
}

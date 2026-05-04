import { and, between, eq } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { expenseLogs } from "../db/tables";
import {
  InsertExpenseDbRequest,
  GetExpensesDbRequest,
  UpdateExpenseDbRequest,
} from "../schemas";

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
        wallet_id: req.walletId ?? null,
      })),
    );
  }

  static async insertOne(req: InsertExpenseDbRequest, db: DrizzleDb) {
    const rows = await db
      .insert(expenseLogs)
      .values({
        user_id: req.userId,
        date: req.date,
        amount: req.amount,
        currency: req.currency,
        category: req.category,
        description: req.description,
        payment_method: req.paymentMethod,
        wallet_id: req.walletId ?? null,
      })
      .returning();
    return rows[0];
  }

  static async update(
    id: number,
    userId: string,
    req: UpdateExpenseDbRequest,
    db: DrizzleDb,
  ) {
    const patch: Record<string, unknown> = {};
    if (req.date !== undefined) patch.date = req.date;
    if (req.amount !== undefined) patch.amount = req.amount;
    if (req.currency !== undefined) patch.currency = req.currency;
    if (req.category !== undefined) patch.category = req.category;
    if (req.description !== undefined) patch.description = req.description;
    if (req.walletId !== undefined) patch.wallet_id = req.walletId;

    const rows = await db
      .update(expenseLogs)
      .set(patch)
      .where(and(eq(expenseLogs.id, id), eq(expenseLogs.user_id, userId)))
      .returning();
    return rows[0] ?? null;
  }

  static async delete(id: number, userId: string, db: DrizzleDb) {
    await db
      .delete(expenseLogs)
      .where(and(eq(expenseLogs.id, id), eq(expenseLogs.user_id, userId)));
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

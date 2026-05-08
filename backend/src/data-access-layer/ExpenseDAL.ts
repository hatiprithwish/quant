import { and, between, eq } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { expenseLogs } from "../db/tables";
import {
  InsertExpenseDbRequest,
  GetExpensesDbRequest,
  UpdateExpenseDbRequest,
} from "../schemas";
import { AppConstants } from "@/config/Constants";

export class ExpenseDAL {
  static async insertMany(
    items: InsertExpenseDbRequest[],
    db: DrizzleDb,
  ): Promise<void> {
    const chunkSize = AppConstants.D1_INSERT_CHUNK_SIZES.EXPENSE;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      await db.insert(expenseLogs).values(
        chunk.map((req) => ({
          user_id: req.userId,
          date: req.date,
          amount: req.amount,
          currency: req.currency,
          category_id: req.categoryId,
          description: req.description,
          wallet_id: req.walletId,
        })),
      );
    }
  }

  static async insertOne(req: InsertExpenseDbRequest, db: DrizzleDb) {
    const rows = await db
      .insert(expenseLogs)
      .values({
        user_id: req.userId,
        date: req.date,
        amount: req.amount,
        currency: req.currency,
        category_id: req.categoryId,
        description: req.description,
        wallet_id: req.walletId,
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
    if (req.categoryId !== undefined) patch.category_id = req.categoryId;
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

    if (req.categoryId !== null) {
      conditions.push(eq(expenseLogs.category_id, req.categoryId));
    }

    return db
      .select()
      .from(expenseLogs)
      .where(and(...conditions))
      .orderBy(expenseLogs.date);
  }
}

import { and, between, eq, or } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { depositLogs, moneyCategories } from "../db/tables";
import { InsertDepositDbRequest, UpdateDepositDbRequest } from "../schemas";

export class DepositDAL {
  static async insert(req: InsertDepositDbRequest, db: DrizzleDb) {
    const rows = await db
      .insert(depositLogs)
      .values({
        user_id: req.userId,
        wallet_id: req.walletId,
        date: req.date,
        amount: req.amount,
        currency: req.currency,
        category_id: req.categoryId,
        description: req.description,
      })
      .returning();
    return rows[0];
  }

  static async update(
    id: number,
    userId: string,
    req: UpdateDepositDbRequest,
    db: DrizzleDb,
  ) {
    const patch: Record<string, unknown> = {};
    if (req.walletId !== undefined) patch.wallet_id = req.walletId;
    if (req.date !== undefined) patch.date = req.date;
    if (req.amount !== undefined) patch.amount = req.amount;
    if (req.currency !== undefined) patch.currency = req.currency;
    if (req.categoryId !== undefined) patch.category_id = req.categoryId;
    if (req.description !== undefined) patch.description = req.description;

    const rows = await db
      .update(depositLogs)
      .set(patch)
      .where(and(eq(depositLogs.id, id), eq(depositLogs.user_id, userId)))
      .returning();
    return rows[0] ?? null;
  }

  static async delete(id: number, userId: string, db: DrizzleDb) {
    await db
      .delete(depositLogs)
      .where(and(eq(depositLogs.id, id), eq(depositLogs.user_id, userId)));
  }

  static async findOpeningBalance(walletId: number, userId: string, db: DrizzleDb) {
    const rows = await db
      .select({ depositLogs })
      .from(depositLogs)
      .leftJoin(moneyCategories, eq(depositLogs.category_id, moneyCategories.id))
      .where(
        and(
          eq(depositLogs.wallet_id, walletId),
          eq(depositLogs.user_id, userId),
          or(
            eq(depositLogs.description, "Opening balance"),
            eq(moneyCategories.name, "opening_balance"),
          ),
        ),
      )
      .limit(1);
    return rows[0]?.depositLogs ?? null;
  }

  static async findByDateRange(
    userId: string,
    from: string,
    to: string,
    db: DrizzleDb,
  ) {
    return db
      .select()
      .from(depositLogs)
      .where(
        and(
          eq(depositLogs.user_id, userId),
          between(depositLogs.date, from, to),
        ),
      )
      .orderBy(depositLogs.date);
  }
}

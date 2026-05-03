import { and, between, eq } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { transferLogs } from "../db/schema";
import { InsertTransferDbRequest, UpdateTransferDbRequest } from "../schemas";

export class TransferDAL {
  static async insert(req: InsertTransferDbRequest, db: DrizzleDb) {
    const rows = await db
      .insert(transferLogs)
      .values({
        user_id: req.userId,
        from_wallet_id: req.fromWalletId,
        to_wallet_id: req.toWalletId,
        amount: req.amount,
        currency: req.currency,
        description: req.description,
        date: req.date,
      })
      .returning();
    return rows[0];
  }

  static async update(
    id: number,
    userId: string,
    req: UpdateTransferDbRequest,
    db: DrizzleDb,
  ) {
    const patch: Record<string, unknown> = {};
    if (req.fromWalletId !== undefined) patch.from_wallet_id = req.fromWalletId;
    if (req.toWalletId !== undefined) patch.to_wallet_id = req.toWalletId;
    if (req.amount !== undefined) patch.amount = req.amount;
    if (req.currency !== undefined) patch.currency = req.currency;
    if (req.description !== undefined) patch.description = req.description;
    if (req.date !== undefined) patch.date = req.date;

    const rows = await db
      .update(transferLogs)
      .set(patch)
      .where(and(eq(transferLogs.id, id), eq(transferLogs.user_id, userId)))
      .returning();
    return rows[0] ?? null;
  }

  static async delete(id: number, userId: string, db: DrizzleDb) {
    await db
      .delete(transferLogs)
      .where(and(eq(transferLogs.id, id), eq(transferLogs.user_id, userId)));
  }

  static async findByDateRange(
    userId: string,
    from: string,
    to: string,
    db: DrizzleDb,
  ) {
    return db
      .select()
      .from(transferLogs)
      .where(
        and(
          eq(transferLogs.user_id, userId),
          between(transferLogs.date, from, to),
        ),
      )
      .orderBy(transferLogs.date);
  }
}

import { and, eq, lte } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { recurringTransactionItems } from "../db/tables";
import {
  GetRecurringTransactionsDbRequest,
  CreateRecurringTransactionDbRequest,
  UpdateRecurringTransactionDbRequest,
} from "../schemas";

export class RecurringTransactionDAL {
  static async findAll(req: GetRecurringTransactionsDbRequest, db: DrizzleDb) {
    return db
      .select()
      .from(recurringTransactionItems)
      .where(eq(recurringTransactionItems.user_id, req.userId));
  }

  static async insert(req: CreateRecurringTransactionDbRequest, db: DrizzleDb) {
    const [row] = await db
      .insert(recurringTransactionItems)
      .values({
        user_id: req.userId,
        wallet_id: req.walletId ?? null,
        type: req.type,
        name: req.name,
        amount: req.amount,
        period: req.period,
        interval: req.interval,
        week_days: req.weekDays,
        month_end: req.monthEnd,
        end_condition: req.endCondition,
        end_date: req.endDate,
        occurrences: req.occurrences,
        category_id: req.categoryId ?? null,
        description: req.description,
        next_date: req.nextDate,
        to_wallet_id: req.toWalletId ?? null,
        asset_id: req.assetId ?? null,
        from_asset_id: req.fromAssetId ?? null,
      })
      .returning();
    return row;
  }

  static async findDue(today: string, db: DrizzleDb) {
    return db
      .select()
      .from(recurringTransactionItems)
      .where(lte(recurringTransactionItems.next_date, today));
  }

  static async updateNextDate(id: number, nextDate: string, db: DrizzleDb) {
    await db
      .update(recurringTransactionItems)
      .set({ next_date: nextDate })
      .where(eq(recurringTransactionItems.id, id));
  }

  static async delete(id: number, db: DrizzleDb) {
    await db
      .delete(recurringTransactionItems)
      .where(eq(recurringTransactionItems.id, id));
  }

  static async update(req: UpdateRecurringTransactionDbRequest, db: DrizzleDb) {
    const updates: Partial<typeof recurringTransactionItems.$inferInsert> = {};
    if (req.walletId !== undefined) updates.wallet_id = req.walletId;
    if (req.type !== undefined) updates.type = req.type;
    if (req.name !== undefined) updates.name = req.name;
    if (req.amount !== undefined) updates.amount = req.amount;
    if (req.period !== undefined) updates.period = req.period;
    if (req.interval !== undefined) updates.interval = req.interval;
    if (req.weekDays !== undefined) updates.week_days = req.weekDays;
    if (req.monthEnd !== undefined) updates.month_end = req.monthEnd;
    if (req.endCondition !== undefined) updates.end_condition = req.endCondition;
    if (req.endDate !== undefined) updates.end_date = req.endDate;
    if (req.occurrences !== undefined) updates.occurrences = req.occurrences;
    if (req.categoryId !== undefined) updates.category_id = req.categoryId;
    if (req.description !== undefined) updates.description = req.description;
    if (req.nextDate !== undefined) updates.next_date = req.nextDate;
    if (req.toWalletId !== undefined) updates.to_wallet_id = req.toWalletId;
    if (req.assetId !== undefined) updates.asset_id = req.assetId;
    if (req.fromAssetId !== undefined) updates.from_asset_id = req.fromAssetId;

    const [row] = await db
      .update(recurringTransactionItems)
      .set(updates)
      .where(
        and(
          eq(recurringTransactionItems.id, req.id),
          eq(recurringTransactionItems.user_id, req.userId),
        ),
      )
      .returning();
    return row ?? null;
  }
}

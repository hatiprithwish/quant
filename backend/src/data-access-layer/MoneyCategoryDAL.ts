import { and, eq, isNull } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { moneyCategories } from "../db/tables";
import { InsertMoneyCategoryDbRequest, UpdateMoneyCategoryDbRequest, MoneyCategoryTypeEnum } from "../schemas";

export class MoneyCategoryDAL {
  static async findAll(userId: string, db: DrizzleDb) {
    return db
      .select()
      .from(moneyCategories)
      .where(and(eq(moneyCategories.user_id, userId), isNull(moneyCategories.deleted_at)));
  }

  static async findByType(userId: string, type: MoneyCategoryTypeEnum, db: DrizzleDb) {
    return db
      .select()
      .from(moneyCategories)
      .where(
        and(
          eq(moneyCategories.user_id, userId),
          eq(moneyCategories.type, type),
          isNull(moneyCategories.deleted_at),
        ),
      );
  }

  static async findById(id: number, userId: string, db: DrizzleDb) {
    const rows = await db
      .select()
      .from(moneyCategories)
      .where(and(eq(moneyCategories.id, id), eq(moneyCategories.user_id, userId)));
    return rows[0] ?? null;
  }

  static async insert(req: InsertMoneyCategoryDbRequest, db: DrizzleDb) {
    const rows = await db
      .insert(moneyCategories)
      .values({
        user_id: req.userId,
        name: req.name,
        display_label: req.display_label,
        color: req.color,
        type: req.type,
      })
      .returning();
    return rows[0];
  }

  static async update(id: number, userId: string, req: UpdateMoneyCategoryDbRequest, db: DrizzleDb) {
    const patch: Record<string, unknown> = {};
    if (req.display_label !== undefined) patch.display_label = req.display_label;
    if (req.color !== undefined) patch.color = req.color;

    const rows = await db
      .update(moneyCategories)
      .set(patch)
      .where(and(eq(moneyCategories.id, id), eq(moneyCategories.user_id, userId)))
      .returning();
    return rows[0] ?? null;
  }

  static async softDelete(id: number, userId: string, db: DrizzleDb) {
    await db
      .update(moneyCategories)
      .set({ deleted_at: new Date().toISOString() })
      .where(and(eq(moneyCategories.id, id), eq(moneyCategories.user_id, userId)));
  }

  static async isUsedByExpense(id: number, db: DrizzleDb): Promise<boolean> {
    const { expenseLogs } = await import("../db/tables");
    const rows = await db
      .select({ id: expenseLogs.id })
      .from(expenseLogs)
      .where(eq(expenseLogs.category_id, id))
      .limit(1);
    return rows.length > 0;
  }

  static async isUsedByDeposit(id: number, db: DrizzleDb): Promise<boolean> {
    const { depositLogs } = await import("../db/tables");
    const rows = await db
      .select({ id: depositLogs.id })
      .from(depositLogs)
      .where(eq(depositLogs.category_id, id))
      .limit(1);
    return rows.length > 0;
  }

  static async isUsedByBudget(id: number, db: DrizzleDb): Promise<boolean> {
    const { budgetCategories } = await import("../db/tables");
    const rows = await db
      .select({ id: budgetCategories.id })
      .from(budgetCategories)
      .where(eq(budgetCategories.category_id, id))
      .limit(1);
    return rows.length > 0;
  }

  static async isUsedByRecurring(id: number, db: DrizzleDb): Promise<boolean> {
    const { recurringTransactionItems } = await import("../db/tables");
    const rows = await db
      .select({ id: recurringTransactionItems.id })
      .from(recurringTransactionItems)
      .where(eq(recurringTransactionItems.category_id, id))
      .limit(1);
    return rows.length > 0;
  }
}

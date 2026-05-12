import { eq, inArray, and } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { debts, debtRepayments } from "../db/tables";
import {
  GetDebtsDbRequest,
  GetDebtRepaymentsDbRequest,
  CreateDebtDbRequest,
  UpdateDebtDbRequest,
  AddRepaymentDbRequest,
} from "../schemas";
import { DebtStatusEnum } from "../schemas/debt/DebtEnum";

export class DebtDAL {
  static async findAll(req: GetDebtsDbRequest, db: DrizzleDb) {
    return db.select().from(debts).where(eq(debts.user_id, req.userId));
  }

  static async findById(id: number, userId: string, db: DrizzleDb) {
    const rows = await db
      .select()
      .from(debts)
      .where(and(eq(debts.id, id), eq(debts.user_id, userId)));
    return rows[0] ?? null;
  }

  static async findRepaymentsByDebtIds(
    req: GetDebtRepaymentsDbRequest,
    db: DrizzleDb,
  ) {
    if (req.debtIds.length === 0) return [];
    return db
      .select()
      .from(debtRepayments)
      .where(inArray(debtRepayments.debt_id, req.debtIds));
  }

  static async findRepaymentsByDebtId(debtId: number, db: DrizzleDb) {
    return db
      .select()
      .from(debtRepayments)
      .where(eq(debtRepayments.debt_id, debtId));
  }

  static async create(req: CreateDebtDbRequest, db: DrizzleDb) {
    const result = await db
      .insert(debts)
      .values({
        user_id: req.userId,
        type: req.type,
        counterparty_name: req.counterparty_name,
        amount: req.amount,
        paid_amount: 0,
        date: req.date,
        color: req.color,
        description: req.description ?? null,
        wallet_id: req.wallet_id,
      })
      .returning();
    return result[0];
  }

  static async update(req: UpdateDebtDbRequest, db: DrizzleDb) {
    const updates: Partial<typeof debts.$inferInsert> = {};
    if (req.counterparty_name !== undefined) updates.counterparty_name = req.counterparty_name;
    if (req.amount !== undefined) updates.amount = req.amount;
    if (req.date !== undefined) updates.date = req.date;
    if (req.color !== undefined) updates.color = req.color;
    if ("description" in req) updates.description = req.description ?? null;

    const result = await db
      .update(debts)
      .set(updates)
      .where(and(eq(debts.id, req.id), eq(debts.user_id, req.userId)))
      .returning();
    return result[0] ?? null;
  }

  static async addRepayment(req: AddRepaymentDbRequest, db: DrizzleDb) {
    await db.insert(debtRepayments).values({
      debt_id: req.debtId,
      amount: req.amount,
      date: req.date,
      note: req.note ?? null,
      wallet_id: req.wallet_id,
    });

    const allRepayments = await DebtDAL.findRepaymentsByDebtId(req.debtId, db);
    const totalPaid = allRepayments.reduce((sum, r) => sum + r.amount, 0);

    const debtRow = await db.select().from(debts).where(eq(debts.id, req.debtId));
    const debtAmount = debtRow[0]?.amount ?? 0;
    const newStatus = totalPaid >= debtAmount ? DebtStatusEnum.Settled : totalPaid > 0 ? DebtStatusEnum.InMotion : DebtStatusEnum.Pending;

    const updated = await db
      .update(debts)
      .set({ paid_amount: totalPaid, status: newStatus })
      .where(eq(debts.id, req.debtId))
      .returning();

    return { debt: updated[0], repayments: allRepayments };
  }
}

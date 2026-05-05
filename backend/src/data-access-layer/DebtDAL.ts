import { eq, inArray } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { debts, debtRepayments } from "../db/tables";
import { GetDebtsDbRequest, GetDebtRepaymentsDbRequest } from "../schemas";

export class DebtDAL {
  static async findAll(req: GetDebtsDbRequest, db: DrizzleDb) {
    return db.select().from(debts).where(eq(debts.user_id, req.userId));
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
}

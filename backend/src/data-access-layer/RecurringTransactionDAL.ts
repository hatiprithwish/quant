import { eq } from "drizzle-orm";
import { DrizzleDb } from "../db";
import { recurringTransactionItems } from "../db/schema";
import { GetRecurringTransactionsDbRequest } from "../schemas";

export class RecurringTransactionDAL {
  static async findAll(req: GetRecurringTransactionsDbRequest, db: DrizzleDb) {
    return db
      .select()
      .from(recurringTransactionItems)
      .where(eq(recurringTransactionItems.user_id, req.userId));
  }
}

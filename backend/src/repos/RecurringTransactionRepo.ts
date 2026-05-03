import { DrizzleDb } from "../db";
import { RecurringTransactionDAL } from "../data-access-layer/RecurringTransactionDAL";
import {
  RecurringTransactionQueryRepoRequest,
  GetRecurringTransactionsResponse,
  expenseCategoryIntToLabel,
} from "../schemas";

export class RecurringTransactionRepo {
  static async getRecurringTransactions(
    req: RecurringTransactionQueryRepoRequest,
    db: DrizzleDb,
  ): Promise<GetRecurringTransactionsResponse> {
    const rows = await RecurringTransactionDAL.findAll({ userId: req.userId }, db);

    return {
      isSuccess: true,
      message: "Recurring transactions retrieved",
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        amount: row.amount,
        period: row.period,
        category: expenseCategoryIntToLabel[row.category],
        next_date: row.next_date,
      })),
    };
  }
}

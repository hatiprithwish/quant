import { DrizzleDb } from "../db";
import { ExpenseDAL } from "../data-access-layer/ExpenseDAL";
import {
  LogExpenseRepoRequest,
  ExpenseQueryRepoRequest,
  expenseCategoryLabelToInt,
  expenseCategoryIntToLabel,
  ExpenseCategoryIntEnum,
  LogExpenseResponse,
  GetExpenseSummaryResponse,
  ExpenseDaySummary,
  ExpenseCategorySummary,
  ExpenseRow,
} from "../schemas";
import { detectPeriod, computePriorRange } from "../utils/periodUtils";

export class ExpenseRepo {
  static async logExpense(
    req: LogExpenseRepoRequest,
    db: DrizzleDb,
  ): Promise<LogExpenseResponse> {
    await ExpenseDAL.insertMany(
      req.entries.map((entry) => ({
        userId: req.userId,
        date: entry.date,
        amount: entry.amount,
        currency: entry.currency ?? "INR",
        category: expenseCategoryLabelToInt[entry.category],
        description: entry.description ?? null,
        walletId: entry.wallet_id ?? null,
      })),
      db,
    );

    return { isSuccess: true, message: "Expenses logged", insertedCount: req.entries.length };
  }

  static async getSummary(
    req: ExpenseQueryRepoRequest,
    db: DrizzleDb,
  ): Promise<GetExpenseSummaryResponse> {
    const categoryFilter = req.category
      ? expenseCategoryLabelToInt[req.category]
      : null;

    const rows = await ExpenseDAL.findByDateRange(
      {
        userId: req.userId,
        from: req.from,
        to: req.to,
        category: categoryFilter,
      },
      db,
    );

    const dayMap = new Map<string, ExpenseRow[]>();
    const categoryMap = new Map<
      ExpenseCategoryIntEnum,
      { total: number; count: number }
    >();
    let grandTotal = 0;

    for (const row of rows) {
      grandTotal += row.amount;

      if (!dayMap.has(row.date)) dayMap.set(row.date, []);
      dayMap.get(row.date)!.push({
        id: row.id,
        date: row.date,
        amount: row.amount,
        currency: row.currency,
        category: expenseCategoryIntToLabel[row.category],
        description: row.description,
        wallet_id: row.wallet_id ?? null,
      });

      const catData = categoryMap.get(row.category) ?? { total: 0, count: 0 };
      catData.total += row.amount;
      catData.count += 1;
      categoryMap.set(row.category, catData);
    }

    const byDay: ExpenseDaySummary[] = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => ({
        date,
        total: items.reduce((s, r) => s + r.amount, 0),
        items,
      }));

    const byCategory: ExpenseCategorySummary[] = Array.from(
      categoryMap.entries(),
    ).map(([catInt, data]) => ({
      category: expenseCategoryIntToLabel[catInt],
      total: data.total,
      count: data.count,
    }));

    const period = detectPeriod(req.from, req.to);
    let vsPrevious: number | null = null;

    if (period) {
      const prior = computePriorRange(period, req.from, req.to);
      const priorRows = await ExpenseDAL.findByDateRange(
        {
          userId: req.userId,
          from: prior.from,
          to: prior.to,
          category: categoryFilter,
        },
        db,
      );
      const priorTotal = priorRows.reduce((s, r) => s + r.amount, 0);
      if (priorTotal > 0) {
        vsPrevious = Math.round(((grandTotal - priorTotal) / priorTotal) * 10000) / 100;
      }
    }

    return {
      isSuccess: true,
      message: "Expense summary retrieved",
      grandTotal,
      byDay,
      byCategory,
      vsPrevious,
    };
  }
}

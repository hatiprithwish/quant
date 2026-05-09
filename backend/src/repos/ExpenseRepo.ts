import { DrizzleDb } from "../db";
import { ExpenseDAL } from "../data-access-layer/ExpenseDAL";
import { MoneyCategoryDAL } from "../data-access-layer/MoneyCategoryDAL";
import {
  LogExpenseRepoRequest,
  ExpenseQueryRepoRequest,
  LogExpenseResponse,
  GetExpenseSummaryResponse,
  ExpenseDaySummary,
  ExpenseCategorySummary,
  ExpenseRow,
  MoneyCategoryItem,
  MoneyCategoryTypeEnum,
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
        categoryId: entry.category_id,
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
    const rows = await ExpenseDAL.findByDateRange(
      {
        userId: req.userId,
        from: req.from,
        to: req.to,
        categoryId: req.category_id ?? null,
      },
      db,
    );

    const categoryIds = [...new Set(rows.map((r) => r.category_id))];
    const categoryMap = await buildCategoryMap(categoryIds, req.userId, db);

    const dayMap = new Map<string, ExpenseRow[]>();
    const catSummaryMap = new Map<number, { total: number; count: number }>();
    let grandTotal = 0;

    for (const row of rows) {
      grandTotal += row.amount;
      const cat = categoryMap.get(row.category_id)!;

      if (!dayMap.has(row.date)) dayMap.set(row.date, []);
      dayMap.get(row.date)!.push({
        id: row.id,
        date: row.date,
        amount: row.amount,
        currency: row.currency,
        category: cat,
        description: row.description,
        wallet_id: row.wallet_id ?? null,
      });

      const s = catSummaryMap.get(row.category_id) ?? { total: 0, count: 0 };
      s.total += row.amount;
      s.count += 1;
      catSummaryMap.set(row.category_id, s);
    }

    const byDay: ExpenseDaySummary[] = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => ({
        date,
        total: items.reduce((s, r) => s + r.amount, 0),
        items,
      }));

    const byCategory: ExpenseCategorySummary[] = Array.from(catSummaryMap.entries()).map(
      ([catId, data]) => ({
        category: categoryMap.get(catId)!,
        total: data.total,
        count: data.count,
      }),
    );

    const period = detectPeriod(req.from, req.to);
    let vsPrevious: number | null = null;

    if (period) {
      const prior = computePriorRange(period, req.from, req.to);
      const priorRows = await ExpenseDAL.findByDateRange(
        {
          userId: req.userId,
          from: prior.from,
          to: prior.to,
          categoryId: req.category_id ?? null,
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

async function buildCategoryMap(
  categoryIds: number[],
  userId: string,
  db: DrizzleDb,
): Promise<Map<number, MoneyCategoryItem>> {
  const allCats = await MoneyCategoryDAL.findAll(userId, db);
  const map = new Map<number, MoneyCategoryItem>();
  for (const c of allCats) {
    if (categoryIds.includes(c.id)) {
      map.set(c.id, {
        id: c.id,
        name: c.name,
        display_label: c.display_label,
        color: c.color,
        type: c.type as MoneyCategoryTypeEnum,
      });
    }
  }
  return map;
}

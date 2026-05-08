import { DrizzleDb } from "../db";
import { ExpenseDAL } from "../data-access-layer/ExpenseDAL";
import { DepositDAL } from "../data-access-layer/DepositDAL";
import { TransferDAL } from "../data-access-layer/TransferDAL";
import { WalletDAL } from "../data-access-layer/WalletDAL";
import { MoneyCategoryDAL } from "../data-access-layer/MoneyCategoryDAL";
import {
  TransactionQueryRepoRequest,
  GetTransactionsResponse,
  UnifiedTransaction,
  TransactionDaySummary,
  MoneyCategoryItem,
  MoneyCategoryTypeEnum,
} from "../schemas";

function toMoneyCategoryItem(row: { id: number; name: string; display_label: string; color: string; type: string }): MoneyCategoryItem {
  return { id: row.id, name: row.name, display_label: row.display_label, color: row.color, type: row.type as MoneyCategoryTypeEnum };
}

export class TransactionRepo {
  static async getTransactions(
    req: TransactionQueryRepoRequest,
    db: DrizzleDb,
  ): Promise<GetTransactionsResponse> {
    const [expenses, deposits, transfers, walletRows, allCats] = await Promise.all([
      ExpenseDAL.findByDateRange(
        { userId: req.userId, from: req.from, to: req.to, categoryId: null },
        db,
      ),
      DepositDAL.findByDateRange(req.userId, req.from, req.to, db),
      TransferDAL.findByDateRange(req.userId, req.from, req.to, db),
      WalletDAL.findAllWithBalance({ userId: req.userId }, db),
      MoneyCategoryDAL.findAll(req.userId, db),
    ]);

    const walletMap = new Map(walletRows.map((w) => [w.id, w.name]));
    const catMap = new Map(allCats.map((c) => [c.id, toMoneyCategoryItem(c)]));

    const items: UnifiedTransaction[] = [
      ...expenses.map((e) => ({
        id: e.id,
        type: "expense" as const,
        date: e.date,
        amount: e.amount,
        currency: e.currency,
        description: e.description,
        category: catMap.get(e.category_id) ?? null,
        wallet_id: e.wallet_id,
        wallet_name: e.wallet_id ? (walletMap.get(e.wallet_id) ?? null) : null,
        from_wallet_id: null,
        from_wallet_name: null,
        to_wallet_id: null,
        to_wallet_name: null,
      })),
      ...deposits.map((d) => ({
        id: d.id,
        type: "income" as const,
        date: d.date,
        amount: d.amount,
        currency: d.currency,
        description: d.description,
        category: catMap.get(d.category_id) ?? null,
        wallet_id: d.wallet_id,
        wallet_name: walletMap.get(d.wallet_id) ?? null,
        from_wallet_id: null,
        from_wallet_name: null,
        to_wallet_id: null,
        to_wallet_name: null,
      })),
      ...transfers.map((t) => ({
        id: t.id,
        type: "transfer" as const,
        date: t.date,
        amount: t.amount,
        currency: t.currency,
        description: t.description,
        category: null,
        wallet_id: null,
        wallet_name: null,
        from_wallet_id: t.from_wallet_id,
        from_wallet_name: walletMap.get(t.from_wallet_id) ?? null,
        to_wallet_id: t.to_wallet_id,
        to_wallet_name: walletMap.get(t.to_wallet_id) ?? null,
      })),
    ];

    items.sort((a, b) => {
      const d = b.date.localeCompare(a.date);
      return d !== 0 ? d : b.id - a.id;
    });

    const dayMap = new Map<string, UnifiedTransaction[]>();
    for (const item of items) {
      if (!dayMap.has(item.date)) dayMap.set(item.date, []);
      dayMap.get(item.date)!.push(item);
    }

    const byDay: TransactionDaySummary[] = Array.from(dayMap.entries()).map(
      ([date, dayItems]) => ({ date, items: dayItems }),
    );

    return {
      isSuccess: true,
      message: "Transactions retrieved",
      byDay,
    };
  }
}

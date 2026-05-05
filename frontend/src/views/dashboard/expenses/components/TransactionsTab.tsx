import { useState } from "react";
import type { GetTransactionsResponse, UnifiedTransaction, WalletWithBalance } from "@/schemas";
import {
  expenseCategoryDisplayLabel,
  expenseCategoryColor,
  ExpenseCategoryLabelEnum,
  DepositCategoryEnum,
  depositCategoryDisplayLabel,
} from "@/schemas";
import EditEntryModal from "./EditEntryModal";

interface Props {
  data: GetTransactionsResponse | null;
  wallets: WalletWithBalance[];
  from: string;
  to: string;
}

type FilterCategory = ExpenseCategoryLabelEnum | DepositCategoryEnum | "transfer" | null;

const INCOME_CATEGORIES = Object.values(DepositCategoryEnum).filter(
  (c) => c !== DepositCategoryEnum.OpeningBalance,
);

function getTransactionLabel(item: UnifiedTransaction): string {
  if (item.type === "expense" && item.expense_category) {
    return expenseCategoryDisplayLabel[item.expense_category];
  }
  if (item.type === "income" && item.income_category) {
    return depositCategoryDisplayLabel[item.income_category];
  }
  return "Transfer";
}

function getTransactionColor(item: UnifiedTransaction): string {
  if (item.type === "expense" && item.expense_category) {
    return expenseCategoryColor[item.expense_category];
  }
  if (item.type === "income") return "#10b981";
  return "#6366f1";
}

function getTypeLabel(item: UnifiedTransaction): string {
  if (item.type === "transfer") {
    return `${item.from_wallet_name ?? "?"} → ${item.to_wallet_name ?? "?"}`;
  }
  const wallet = item.wallet_name;
  if (wallet) return wallet;
  return "";
}

function matchesFilter(item: UnifiedTransaction, filter: FilterCategory): boolean {
  if (filter === null) return true;
  if (filter === "transfer") return item.type === "transfer";
  if (item.type === "expense") return item.expense_category === filter;
  if (item.type === "income") return item.income_category === filter;
  return false;
}

export default function TransactionsTab({ data, wallets, from, to }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>(null);
  const [editingEntry, setEditingEntry] = useState<UnifiedTransaction | null>(null);

  const days = data
    ? data.byDay
        .map((day) => ({
          ...day,
          items: day.items.filter((item) => matchesFilter(item, activeFilter)),
        }))
        .filter((day) => day.items.length > 0)
    : [];

  const presentExpenseCategories = data
    ? Object.values(ExpenseCategoryLabelEnum).filter((cat) =>
        data.byDay.some((day) => day.items.some((item) => item.expense_category === cat))
      )
    : [];

  const presentIncomeCategories = data
    ? INCOME_CATEGORIES.filter((cat) =>
        data.byDay.some((day) => day.items.some((item) => item.income_category === cat))
      )
    : [];

  const hasTransfers = data
    ? data.byDay.some((day) => day.items.some((item) => item.type === "transfer"))
    : false;

  return (
    <div className="space-y-4">
      {/* Category filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setActiveFilter(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            activeFilter === null
              ? "bg-gray-900 dark:bg-white text-white dark:text-black"
              : "bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-600"
          }`}
        >
          All
        </button>

        {presentExpenseCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === cat
                ? "bg-gray-900 dark:bg-white text-white dark:text-black"
                : "bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-600"
            }`}
          >
            {expenseCategoryDisplayLabel[cat]}
          </button>
        ))}

        {presentIncomeCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === cat
                ? "bg-gray-900 dark:bg-white text-white dark:text-black"
                : "bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-600"
            }`}
          >
            {depositCategoryDisplayLabel[cat]}
          </button>
        ))}

        {hasTransfers && (
          <button
            onClick={() => setActiveFilter(activeFilter === "transfer" ? null : "transfer")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === "transfer"
                ? "bg-gray-900 dark:bg-white text-white dark:text-black"
                : "bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-600"
            }`}
          >
            Transfer
          </button>
        )}
      </div>

      {/* Transaction list */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
        {!data || days.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-neutral-500 text-sm">
            No transactions for this period.
          </div>
        ) : (
          days.map((day) => (
            <div key={day.date}>
              <div className="px-5 py-2.5 bg-gray-50 dark:bg-neutral-950 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
                  {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
                  {day.items.filter((i) => i.type === "expense").length > 0
                    ? `−₹${day.items.filter((i) => i.type === "expense").reduce((s, i) => s + i.amount, 0).toFixed(0)}`
                    : ""}
                </span>
              </div>

              {day.items.map((item, idx) => {
                const dotColor = getTransactionColor(item);
                const categoryLabel = getTransactionLabel(item);
                const walletLabel = getTypeLabel(item);
                const isExpense = item.type === "expense";
                const isIncome = item.type === "income";

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`px-5 py-3 flex items-center justify-between ${
                      idx < day.items.length - 1
                        ? "border-b border-gray-50 dark:border-neutral-800"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: dotColor }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-neutral-100 truncate">
                          {item.description ?? "—"}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-neutral-500">
                          {categoryLabel}
                          {walletLabel ? ` · ${walletLabel}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span
                        className={`text-sm font-semibold ${
                          isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isExpense
                            ? "text-gray-900 dark:text-white"
                            : "text-indigo-500 dark:text-indigo-400"
                        }`}
                      >
                        {isIncome ? "+" : isExpense ? "−" : ""}₹{item.amount.toFixed(0)}
                      </span>
                      <button
                        onClick={() => setEditingEntry(item)}
                        className="text-xs text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          wallets={wallets}
          from={from}
          to={to}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import type { WalletWithBalance } from "@/schemas";
import {
  DepositCategoryEnum,
  ExpenseCategoryLabelEnum,
  depositCategoryDisplayLabel,
  expenseCategoryDisplayLabel,
} from "@/schemas";
import {
  useMutationCreateExpense,
  useMutationCreateIncome,
  useMutationCreateTransfer,
} from "@/api/mutations";

type TabType = "income" | "expense" | "transfer";

interface Props {
  wallets: WalletWithBalance[];
  from: string;
  to: string;
  onClose: () => void;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function AddEntryModal({ wallets, from, to, onClose }: Props) {
  const [tab, setTab] = useState<TabType>("expense");
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Expense
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategoryLabelEnum>(ExpenseCategoryLabelEnum.Other);
  const [expenseWalletId, setExpenseWalletId] = useState<number | "">(wallets[0]?.id ?? "");

  // Income
  const [incomeCategory, setIncomeCategory] = useState<DepositCategoryEnum>(DepositCategoryEnum.Salary);
  const [incomeWalletId, setIncomeWalletId] = useState<number | "">(wallets[0]?.id ?? "");

  // Transfer
  const [fromWalletId, setFromWalletId] = useState<number | "">(wallets[0]?.id ?? "");
  const [toWalletId, setToWalletId] = useState<number | "">(wallets[1]?.id ?? "");

  const createExpense = useMutationCreateExpense(from, to);
  const createIncome = useMutationCreateIncome(from, to);
  const createTransfer = useMutationCreateTransfer(from, to);

  const isPending = createExpense.isPending || createIncome.isPending || createTransfer.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Enter a valid amount.");
    if (!date) return setError("Enter a date.");

    try {
      if (tab === "expense") {
        if (!expenseWalletId) return setError("Select a wallet.");
        await createExpense.mutateAsync({
          date,
          amount: amt,
          category: expenseCategory,
          description: description || undefined,
          wallet_id: expenseWalletId as number,
        });
      } else if (tab === "income") {
        if (!incomeWalletId) return setError("Select a wallet.");
        await createIncome.mutateAsync({
          wallet_id: incomeWalletId as number,
          date,
          amount: amt,
          category: incomeCategory,
          description: description || undefined,
        });
      } else {
        if (!fromWalletId || !toWalletId) return setError("Select both wallets.");
        if (fromWalletId === toWalletId) return setError("From and To wallets must be different.");
        await createTransfer.mutateAsync({
          from_wallet_id: fromWalletId as number,
          to_wallet_id: toWalletId as number,
          amount: amt,
          date,
          description: description || undefined,
        });
      }
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    }
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: "expense", label: "Expense" },
    { key: "income", label: "Income" },
    { key: "transfer", label: "Transfer" },
  ];

  const inputCls =
    "w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500";

  const selectCls =
    "w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500";

  const labelCls = "block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Add Entry</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-neutral-800 rounded-xl mb-5">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => { setTab(t.key); setError(null); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === t.key
                  ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common fields: date + amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <input
                type="date"
                value={date}
                max={today()}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Amount (₹)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={inputCls}
              />
            </div>
          </div>

          {/* Tab-specific fields */}
          {tab === "expense" && (
            <>
              <div>
                <label className={labelCls}>Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategoryLabelEnum)}
                  className={selectCls}
                >
                  {Object.values(ExpenseCategoryLabelEnum).map((cat) => (
                    <option key={cat} value={cat}>{expenseCategoryDisplayLabel[cat]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Wallet</label>
                <select
                  value={expenseWalletId}
                  onChange={(e) => setExpenseWalletId(Number(e.target.value))}
                  className={selectCls}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {tab === "income" && (
            <>
              <div>
                <label className={labelCls}>Category</label>
                <select
                  value={incomeCategory}
                  onChange={(e) => setIncomeCategory(e.target.value as DepositCategoryEnum)}
                  className={selectCls}
                >
                  {Object.values(DepositCategoryEnum)
                    .filter((c) => c !== DepositCategoryEnum.OpeningBalance)
                    .map((cat) => (
                      <option key={cat} value={cat}>{depositCategoryDisplayLabel[cat]}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Wallet</label>
                <select
                  value={incomeWalletId}
                  onChange={(e) => setIncomeWalletId(Number(e.target.value))}
                  className={selectCls}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {tab === "transfer" && (
            <>
              <div>
                <label className={labelCls}>From Wallet</label>
                <select
                  value={fromWalletId}
                  onChange={(e) => setFromWalletId(Number(e.target.value))}
                  className={selectCls}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>To Wallet</label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(Number(e.target.value))}
                  className={selectCls}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className={labelCls}>Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tab === "transfer" ? "e.g. Monthly sweep" : "e.g. Zomato order"}
              className={inputCls}
            />
          </div>

          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

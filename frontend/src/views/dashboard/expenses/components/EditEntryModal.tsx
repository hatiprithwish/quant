import { useState } from "react";
import type { UnifiedTransaction, WalletWithBalance } from "@/schemas";
import {
  DepositCategoryEnum,
  ExpenseCategoryLabelEnum,
  depositCategoryDisplayLabel,
  expenseCategoryDisplayLabel,
} from "@/schemas";
import {
  useMutationUpdateExpense,
  useMutationDeleteExpense,
  useMutationUpdateIncome,
  useMutationDeleteIncome,
  useMutationUpdateTransfer,
  useMutationDeleteTransfer,
} from "@/api/mutations";

interface Props {
  entry: UnifiedTransaction;
  wallets: WalletWithBalance[];
  from: string;
  to: string;
  onClose: () => void;
}

export default function EditEntryModal({ entry, wallets, from, to, onClose }: Props) {
  const [date, setDate] = useState(entry.date);
  const [amount, setAmount] = useState(entry.amount.toString());
  const [description, setDescription] = useState(entry.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategoryLabelEnum>(
    entry.expense_category ?? ExpenseCategoryLabelEnum.Other,
  );
  const [expenseWalletId, setExpenseWalletId] = useState<number>(
    entry.wallet_id ?? wallets[0]?.id ?? 0,
  );

  const [incomeCategory, setIncomeCategory] = useState<DepositCategoryEnum>(
    entry.income_category ?? DepositCategoryEnum.Other,
  );
  const [incomeWalletId, setIncomeWalletId] = useState<number>(
    entry.wallet_id ?? wallets[0]?.id ?? 0,
  );

  const [fromWalletId, setFromWalletId] = useState<number>(
    entry.from_wallet_id ?? wallets[0]?.id ?? 0,
  );
  const [toWalletId, setToWalletId] = useState<number>(
    entry.to_wallet_id ?? wallets[1]?.id ?? 0,
  );

  const updateExpense = useMutationUpdateExpense(entry.id, from, to);
  const deleteExpense = useMutationDeleteExpense(from, to);
  const updateIncome = useMutationUpdateIncome(entry.id, from, to);
  const deleteIncome = useMutationDeleteIncome(from, to);
  const updateTransfer = useMutationUpdateTransfer(entry.id, from, to);
  const deleteTransfer = useMutationDeleteTransfer(from, to);

  const isPending =
    updateExpense.isPending || deleteExpense.isPending ||
    updateIncome.isPending || deleteIncome.isPending ||
    updateTransfer.isPending || deleteTransfer.isPending;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Enter a valid amount.");

    try {
      if (entry.type === "expense") {
        await updateExpense.mutateAsync({
          date,
          amount: amt,
          category: expenseCategory,
          description: description || null,
          wallet_id: expenseWalletId,
        });
      } else if (entry.type === "income") {
        await updateIncome.mutateAsync({
          date,
          amount: amt,
          category: incomeCategory,
          description: description || null,
          wallet_id: incomeWalletId,
        });
      } else {
        if (fromWalletId === toWalletId) return setError("From and To wallets must be different.");
        await updateTransfer.mutateAsync({
          date,
          amount: amt,
          from_wallet_id: fromWalletId,
          to_wallet_id: toWalletId,
          description: description || null,
        });
      }
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    }
  }

  async function handleDelete() {
    try {
      if (entry.type === "expense") await deleteExpense.mutateAsync(entry.id);
      else if (entry.type === "income") await deleteIncome.mutateAsync(entry.id);
      else await deleteTransfer.mutateAsync(entry.id);
      onClose();
    } catch {
      setError("Failed to delete. Please try again.");
    }
  }

  const typeLabel =
    entry.type === "expense" ? "Expense" :
    entry.type === "income" ? "Income" : "Transfer";

  const inputCls =
    "w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500";
  const selectCls = inputCls;
  const labelCls = "block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Edit {typeLabel}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {confirmDelete ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-neutral-200">
              Delete this {typeLabel.toLowerCase()} entry?
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleDelete} disabled={isPending} className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                {isPending ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Amount (₹)</label>
                <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
              </div>
            </div>

            {entry.type === "expense" && (
              <>
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategoryLabelEnum)} className={selectCls}>
                    {Object.values(ExpenseCategoryLabelEnum).map((cat) => (
                      <option key={cat} value={cat}>{expenseCategoryDisplayLabel[cat]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Wallet</label>
                  <select value={expenseWalletId} onChange={(e) => setExpenseWalletId(Number(e.target.value))} className={selectCls}>
                    {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </>
            )}

            {entry.type === "income" && (
              <>
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={incomeCategory} onChange={(e) => setIncomeCategory(e.target.value as DepositCategoryEnum)} className={selectCls}>
                    {Object.values(DepositCategoryEnum)
                      .filter((c) => c !== DepositCategoryEnum.OpeningBalance)
                      .map((cat) => (
                        <option key={cat} value={cat}>{depositCategoryDisplayLabel[cat]}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Wallet</label>
                  <select value={incomeWalletId} onChange={(e) => setIncomeWalletId(Number(e.target.value))} className={selectCls}>
                    {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </>
            )}

            {entry.type === "transfer" && (
              <>
                <div>
                  <label className={labelCls}>From Wallet</label>
                  <select value={fromWalletId} onChange={(e) => setFromWalletId(Number(e.target.value))} className={selectCls}>
                    {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>To Wallet</label>
                  <select value={toWalletId} onChange={(e) => setToWalletId(Number(e.target.value))} className={selectCls}>
                    {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className={labelCls}>Description (optional)</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
            </div>

            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="py-2 px-4 rounded-lg text-sm font-medium border border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                Delete
              </button>
              <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isPending} className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50">
                {isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import type { MoneyCategoryItem } from "@/schemas";
import { MoneyCategoryTypeEnum, BudgetPeriodEnum, BudgetWithSpent } from "@/schemas";
import Spinner from "@/components/common/Spinner";
import { useGetMoneyCategories } from "@/api/cachedQueries";
import { useMutationUpdateBudget, useMutationDeleteBudget } from "@/api/mutations";

interface Props {
  budget: BudgetWithSpent;
  onClose: () => void;
}

const COLOR_SWATCHES = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#ec4899", "#f43f5e", "#64748b",
];

const PERIOD_LABELS: Record<BudgetPeriodEnum, string> = {
  [BudgetPeriodEnum.Weekly]: "Weekly",
  [BudgetPeriodEnum.Monthly]: "Monthly",
  [BudgetPeriodEnum.Quarterly]: "Quarterly",
  [BudgetPeriodEnum.Yearly]: "Yearly",
};

export default function EditBudgetModal({ budget, onClose }: Props) {
  const isAllCategories = budget.categories.length === 0;

  const [name, setName] = useState(budget.name);
  const [color, setColor] = useState(budget.color);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    isAllCategories ? [] : budget.categories.map((c) => c.id),
  );
  const [allSelected, setAllSelected] = useState(isAllCategories);
  const [amount, setAmount] = useState(String(budget.amount));
  const [period, setPeriod] = useState<BudgetPeriodEnum>(budget.period);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: categoriesData } = useGetMoneyCategories();
  const expenseCategories = categoriesData?.categories.filter((c) => c.type === MoneyCategoryTypeEnum.Expense) ?? [];

  const updateMutation = useMutationUpdateBudget(budget.id);
  const deleteMutation = useMutationDeleteBudget();

  function toggleCategory(cat: MoneyCategoryItem) {
    setAllSelected(false);
    setSelectedCategoryIds((prev) =>
      prev.includes(cat.id) ? prev.filter((id) => id !== cat.id) : [...prev, cat.id],
    );
  }

  function toggleAll() {
    if (allSelected) {
      setAllSelected(false);
      setSelectedCategoryIds([]);
    } else {
      setAllSelected(true);
      setSelectedCategoryIds([]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Enter a budget name.");
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) return setError("Enter a valid amount.");

    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        color,
        category_ids: allSelected ? [] : selectedCategoryIds,
        amount: amt,
        period,
      });
      onClose();
    } catch {
      setError("Failed to update budget.");
    }
  }

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(budget.id);
      onClose();
    } catch {
      setError("Failed to delete budget.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: budget.color }} />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Edit Budget</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5">
              Amount (₹)
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5">
              Categories
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 dark:border-neutral-700 rounded-lg p-2">
              <button
                type="button"
                onClick={toggleAll}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  allSelected ? "bg-gray-100 dark:bg-neutral-800" : "hover:bg-gray-50 dark:hover:bg-neutral-800"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    allSelected
                      ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white"
                      : "border-gray-300 dark:border-neutral-600"
                  }`}
                >
                  {allSelected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white dark:text-black" />
                    </svg>
                  )}
                </span>
                <span className="font-medium text-gray-700 dark:text-neutral-300">All Categories</span>
              </button>

              <div className="border-t border-gray-100 dark:border-neutral-800 my-1" />

              {expenseCategories.map((cat) => {
                const checked = !allSelected && selectedCategoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    disabled={allSelected}
                    className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors disabled:opacity-40 ${
                      checked ? "bg-gray-100 dark:bg-neutral-800" : "hover:bg-gray-50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        checked
                          ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white"
                          : "border-gray-300 dark:border-neutral-600"
                      }`}
                    >
                      {checked && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white dark:text-black" />
                        </svg>
                      )}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-gray-700 dark:text-neutral-300">
                      {cat.display_label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? "ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5">
              Period
            </label>
            <div className="flex gap-2">
              {Object.values(BudgetPeriodEnum).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    period === p
                      ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black"
                      : "border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-600"
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="py-2 px-3 rounded-lg text-sm font-medium border border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50"
            >
              {updateMutation.isPending ? <><Spinner size="sm" /> Saving…</> : "Save"}
            </button>
          </div>
        </form>

        {confirmDelete && (
          <div className="mt-4 p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950">
            <p className="text-xs text-red-600 dark:text-red-400 mb-3">
              Delete this budget? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? <><Spinner size="sm" /> Deleting…</> : "Confirm Delete"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

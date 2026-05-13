import { useState } from "react";
import type { MoneyCategoryItem } from "@/schemas";
import { MoneyCategoryTypeEnum, BudgetPeriodEnum } from "@/schemas";
import Spinner from "@/components/common/Spinner";
import { useGetMoneyCategories } from "@/api/cachedQueries";
import { useMutationCreateBudget } from "@/api/mutations";
import { AppConstants } from "@/config/Constants";

interface Props {
  onClose: () => void;
}

const COLOR_SWATCHES = AppConstants.PALETTE;

const PERIOD_LABELS: Record<BudgetPeriodEnum, string> = {
  [BudgetPeriodEnum.Weekly]: "Weekly",
  [BudgetPeriodEnum.Monthly]: "Monthly",
  [BudgetPeriodEnum.Quarterly]: "Quarterly",
  [BudgetPeriodEnum.Yearly]: "Yearly",
};

export default function AddBudgetModal({ onClose }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(COLOR_SWATCHES[6]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<BudgetPeriodEnum>(BudgetPeriodEnum.Monthly);
  const [error, setError] = useState<string | null>(null);

  const { data: categoriesData } = useGetMoneyCategories();
  const expenseCategories = categoriesData?.categories.filter((c) => c.type === MoneyCategoryTypeEnum.Expense) ?? [];

  const mutation = useMutationCreateBudget();

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
      await mutation.mutateAsync({
        name: name.trim(),
        color,
        category_ids: allSelected ? [] : selectedCategoryIds,
        amount: amt,
        period,
      });
      onClose();
    } catch {
      setError("Failed to create budget.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">New Budget</h2>
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
              placeholder="e.g. Bills (Phone, Wifi, Electricity)"
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
              placeholder="e.g. 5000"
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
                  allSelected
                    ? "bg-gray-100 dark:bg-neutral-800"
                    : "hover:bg-gray-50 dark:hover:bg-neutral-800"
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
                      checked
                        ? "bg-gray-100 dark:bg-neutral-800"
                        : "hover:bg-gray-50 dark:hover:bg-neutral-800"
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
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? <><Spinner size="sm" /> Creating…</> : "Create Budget"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

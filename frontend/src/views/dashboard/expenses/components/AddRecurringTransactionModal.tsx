import { useState } from "react";
import {
  ExpenseCategoryLabelEnum,
  expenseCategoryDisplayLabel,
  RecurringTransactionTypeEnum,
  RecurringTransactionPeriodEnum,
  RecurringEndConditionEnum,
} from "@/schemas";
import type { WalletWithBalance } from "@/schemas";
import {
  useMutationCreateRecurringTransaction,
  useMutationUpdateRecurringTransaction,
} from "@/api/mutations";
import type {
  CreateRecurringTransactionInput,
  UpdateRecurringTransactionInput,
} from "@/api/mutations";
import type { RecurringTransactionItem } from "@/schemas";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  wallets: WalletWithBalance[];
  onClose: () => void;
  editing?: RecurringTransactionItem;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function AddRecurringTransactionModal({ wallets, onClose, editing }: Props) {
  const [txType, setTxType] = useState<RecurringTransactionTypeEnum>(
    editing?.type ?? RecurringTransactionTypeEnum.Expense,
  );
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [category, setCategory] = useState<ExpenseCategoryLabelEnum>(
    editing?.category ?? ExpenseCategoryLabelEnum.Other,
  );
  const [walletId, setWalletId] = useState<number | "">(editing?.wallet_id ?? (wallets[0]?.id ?? ""));
  const [period, setPeriod] = useState<RecurringTransactionPeriodEnum>(
    editing?.period ?? RecurringTransactionPeriodEnum.Monthly,
  );
  const [interval, setInterval] = useState(editing?.interval ?? 1);
  const [weekDays, setWeekDays] = useState<number[]>(editing?.week_days ?? [1]);
  const [monthEnd, setMonthEnd] = useState(editing?.month_end ?? false);
  const [endCondition, setEndCondition] = useState<RecurringEndConditionEnum>(
    editing?.end_condition ?? RecurringEndConditionEnum.Forever,
  );
  const [endDate, setEndDate] = useState(editing?.end_date ?? "");
  const [occurrences, setOccurrences] = useState(editing?.occurrences ? String(editing.occurrences) : "");
  const [startDate, setStartDate] = useState(editing?.next_date ?? today());
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutationCreateRecurringTransaction();
  const updateMutation = useMutationUpdateRecurringTransaction(editing?.id ?? 0);
  const isPending = createMutation.isPending || updateMutation.isPending;

  function toggleWeekDay(d: number) {
    setWeekDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!amount || Number(amount) <= 0) return setError("Enter a valid amount.");
    if (!walletId) return setError("Select a wallet.");
    if (period === RecurringTransactionPeriodEnum.Weekly && weekDays.length === 0)
      return setError("Select at least one day of the week.");
    if (endCondition === RecurringEndConditionEnum.Until && !endDate)
      return setError("Select an end date.");
    if (endCondition === RecurringEndConditionEnum.For && (!occurrences || Number(occurrences) < 1))
      return setError("Enter number of occurrences.");

    try {
      if (editing) {
        const payload: UpdateRecurringTransactionInput = {
          type: txType,
          amount: Number(amount),
          description: description || null,
          category,
          wallet_id: Number(walletId),
          period,
          interval,
          week_days: period === RecurringTransactionPeriodEnum.Weekly ? weekDays : undefined,
          month_end: period === RecurringTransactionPeriodEnum.Monthly ? monthEnd : false,
          end_condition: endCondition,
          end_date: endCondition === RecurringEndConditionEnum.Until ? endDate : null,
          occurrences: endCondition === RecurringEndConditionEnum.For ? Number(occurrences) : null,
          start_date: startDate,
        };
        await updateMutation.mutateAsync(payload);
      } else {
        const payload: CreateRecurringTransactionInput = {
          type: txType,
          name: description || `${period} ${txType}`,
          amount: Number(amount),
          description: description || undefined,
          category,
          wallet_id: Number(walletId),
          period,
          interval,
          week_days: period === RecurringTransactionPeriodEnum.Weekly ? weekDays : undefined,
          month_end: period === RecurringTransactionPeriodEnum.Monthly ? monthEnd : false,
          end_condition: endCondition,
          end_date: endCondition === RecurringEndConditionEnum.Until ? endDate : undefined,
          occurrences: endCondition === RecurringEndConditionEnum.For ? Number(occurrences) : undefined,
          start_date: startDate,
        };
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    }
  }

  const inputCls =
    "w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500";
  const labelCls = "block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5";

  const startDayNumber = new Date(startDate + "T00:00:00").getDate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-neutral-900 rounded-t-2xl px-6 pt-6 pb-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {editing ? "Edit Recurring" : "Add Recurring"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Income / Expense toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-700">
            {[RecurringTransactionTypeEnum.Income, RecurringTransactionTypeEnum.Expense].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTxType(t)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  txType === t
                    ? t === RecurringTransactionTypeEnum.Expense
                      ? "bg-red-500 text-white"
                      : "bg-emerald-500 text-white"
                    : "text-gray-400 dark:text-neutral-500 hover:bg-gray-50 dark:hover:bg-neutral-800"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className={labelCls}>Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className={inputCls + " pl-7"}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Netflix, Gym"
              className={inputCls}
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategoryLabelEnum)}
              className={inputCls}
            >
              {Object.values(ExpenseCategoryLabelEnum).map((c) => (
                <option key={c} value={c}>
                  {expenseCategoryDisplayLabel[c]}
                </option>
              ))}
            </select>
          </div>

          {/* Wallet */}
          <div>
            <label className={labelCls}>Wallet</label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(Number(e.target.value))}
              className={inputCls}
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start date */}
          <div>
            <label className={labelCls}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Period */}
          <div>
            <label className={labelCls}>Repeats</label>
            <div className="flex gap-2">
              {[
                { label: "Weekly", value: RecurringTransactionPeriodEnum.Weekly },
                { label: "Monthly", value: RecurringTransactionPeriodEnum.Monthly },
                { label: "Yearly", value: RecurringTransactionPeriodEnum.Yearly },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPeriod(p.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${
                    period === p.value
                      ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black"
                      : "border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-600"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interval */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-neutral-400 shrink-0">Every</span>
            <input
              type="number"
              min="1"
              max="99"
              value={interval}
              onChange={(e) => setInterval(Math.max(1, Number(e.target.value)))}
              className="w-16 text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-2 py-1.5 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-center focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500"
            />
            <span className="text-sm text-gray-500 dark:text-neutral-400 shrink-0">
              {period === RecurringTransactionPeriodEnum.Weekly
                ? interval === 1 ? "Week" : "Weeks"
                : period === RecurringTransactionPeriodEnum.Monthly
                ? interval === 1 ? "Month" : "Months"
                : interval === 1 ? "Year" : "Years"}
            </span>
          </div>

          {/* Weekly: day picker */}
          {period === RecurringTransactionPeriodEnum.Weekly && (
            <div>
              <label className={labelCls}>On</label>
              <div className="flex gap-1.5">
                {DAYS.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleWeekDay(i)}
                    className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      weekDays.includes(i)
                        ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black"
                        : "border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly: day anchoring */}
          {period === RecurringTransactionPeriodEnum.Monthly && (
            <div>
              <label className={labelCls}>Day</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMonthEnd(false)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${
                    !monthEnd
                      ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black"
                      : "border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-600"
                  }`}
                >
                  Same day each month ({startDayNumber})
                </button>
                <button
                  type="button"
                  onClick={() => setMonthEnd(true)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${
                    monthEnd
                      ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black"
                      : "border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-600"
                  }`}
                >
                  End of month
                </button>
              </div>
            </div>
          )}

          {/* End condition */}
          <div>
            <label className={labelCls}>Ends</label>
            <div className="flex gap-2">
              {[
                { label: "Forever", value: RecurringEndConditionEnum.Forever },
                { label: "Until", value: RecurringEndConditionEnum.Until },
                { label: "For N times", value: RecurringEndConditionEnum.For },
              ].map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setEndCondition(e.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${
                    endCondition === e.value
                      ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black"
                      : "border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-600"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {endCondition === RecurringEndConditionEnum.Until && (
            <div>
              <label className={labelCls}>End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputCls}
              />
            </div>
          )}

          {endCondition === RecurringEndConditionEnum.For && (
            <div>
              <label className={labelCls}>Number of times</label>
              <input
                type="number"
                min="1"
                value={occurrences}
                onChange={(e) => setOccurrences(e.target.value)}
                placeholder="e.g. 12"
                className={inputCls}
              />
            </div>
          )}

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
              {isPending ? "Saving…" : editing ? "Save Changes" : "Add Recurring"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

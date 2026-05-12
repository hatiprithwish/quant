import { useState } from "react";
import type { DebtEntry, WalletWithBalance } from "@/schemas";
import { useMutationUpdateDebt, useMutationAddRepayment } from "@/api/mutations";
import Spinner from "@/components/common/Spinner";
import { AppConstants } from "@/config/Constants";

interface Props {
  debt: DebtEntry;
  wallets: WalletWithBalance[];
  onClose: () => void;
}

type TabType = "details" | "repayment";

const COLORS = AppConstants.PALETTE;

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function EditDebtModal({ debt, wallets, onClose }: Props) {
  const [tab, setTab] = useState<TabType>("details");

  // Details form
  const [counterpartyName, setCounterpartyName] = useState(debt.counterparty_name);
  const [amount, setAmount] = useState(String(debt.amount));
  const [date, setDate] = useState(debt.date);
  const [color, setColor] = useState(debt.color);
  const [description, setDescription] = useState(debt.description ?? "");
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Repayment form
  const [repayAmount, setRepayAmount] = useState("");
  const [repayDate, setRepayDate] = useState(today());
  const [repayNote, setRepayNote] = useState("");
  const [repayWalletId, setRepayWalletId] = useState<number | "">(debt.wallet_id ?? wallets[0]?.id ?? "");
  const [repayError, setRepayError] = useState<string | null>(null);

  const updateDebt = useMutationUpdateDebt();
  const addRepayment = useMutationAddRepayment();

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDetailsError(null);
    const amt = Number(amount);
    if (!counterpartyName.trim()) return setDetailsError("Enter a name.");
    if (!amt || amt <= 0) return setDetailsError("Enter a valid amount.");
    if (!date) return setDetailsError("Enter a date.");

    try {
      await updateDebt.mutateAsync({
        id: debt.id,
        counterparty_name: counterpartyName.trim(),
        amount: amt,
        date,
        color,
        description: description || null,
      });
      onClose();
    } catch {
      setDetailsError("Failed to save. Please try again.");
    }
  }

  async function handleRepaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRepayError(null);
    const amt = Number(repayAmount);
    if (!amt || amt <= 0) return setRepayError("Enter a valid amount.");
    if (!repayDate) return setRepayError("Enter a date.");

    const remaining = debt.amount - debt.paid_amount;
    if (amt > remaining) return setRepayError(`Max repayment is ₹${remaining.toFixed(2)}.`);
    if (!repayWalletId) return setRepayError("Select a wallet.");

    try {
      await addRepayment.mutateAsync({
        debtId: debt.id,
        amount: amt,
        date: repayDate,
        note: repayNote || undefined,
        wallet_id: repayWalletId as number,
      });
      onClose();
    } catch {
      setRepayError("Failed to save. Please try again.");
    }
  }

  const inputCls =
    "w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500";
  const selectCls =
    "w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500";
  const labelCls = "block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5";

  const remaining = debt.amount - debt.paid_amount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {debt.counterparty_name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
              {debt.type === "lent" ? "Lent" : "Borrowed"} · ₹{debt.amount.toLocaleString()} · Remaining ₹{remaining.toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-neutral-800 rounded-xl mb-5">
          {([{ key: "details", label: "Edit Details" }, { key: "repayment", label: "Add Repayment" }] as const).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
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

        {tab === "details" && (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Name / Organization</label>
              <input
                type="text"
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Amount (₹)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-neutral-400 scale-110" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was it for?"
                className={inputCls}
              />
            </div>

            {detailsError && <p className="text-xs text-red-500 dark:text-red-400">{detailsError}</p>}

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
                disabled={updateDebt.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                {updateDebt.isPending ? <><Spinner size="sm" /> Saving…</> : "Save"}
              </button>
            </div>
          </form>
        )}

        {tab === "repayment" && (
          <form onSubmit={handleRepaymentSubmit} className="space-y-4">
            {debt.repayments.length > 0 && (
              <div className="space-y-2">
                <p className={labelCls}>Previous repayments</p>
                {debt.repayments.map((r) => (
                  <div key={r.id} className="flex justify-between text-xs text-gray-600 dark:text-neutral-400 py-1 border-b border-gray-100 dark:border-neutral-800">
                    <span>{r.date}{r.note ? ` · ${r.note}` : ""}</span>
                    <span className="font-medium text-gray-900 dark:text-white">₹{r.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {remaining <= 0 ? (
              <p className="text-xs text-green-600 dark:text-green-400 text-center py-4">Fully settled.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Amount (₹)</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={remaining}
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      placeholder="0.00"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Date</label>
                    <input
                      type="date"
                      value={repayDate}
                      onChange={(e) => setRepayDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Wallet</label>
                  <select
                    value={repayWalletId}
                    onChange={(e) => setRepayWalletId(Number(e.target.value))}
                    className={selectCls}
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Note (optional)</label>
                  <input
                    type="text"
                    value={repayNote}
                    onChange={(e) => setRepayNote(e.target.value)}
                    placeholder="e.g. Partial via UPI"
                    className={inputCls}
                  />
                </div>

                {repayError && <p className="text-xs text-red-500 dark:text-red-400">{repayError}</p>}

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
                    disabled={addRepayment.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50"
                  >
                    {addRepayment.isPending ? <><Spinner size="sm" /> Saving…</> : "Add Repayment"}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

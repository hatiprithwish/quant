import { useState } from "react";
import { DebtTypeEnum } from "@/schemas";
import type { WalletWithBalance } from "@/schemas";
import { useMutationCreateDebt } from "@/api/mutations";

interface Props {
  wallets: WalletWithBalance[];
  onClose: () => void;
}

const COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function AddDebtModal({ wallets, onClose }: Props) {
  const [type, setType] = useState<DebtTypeEnum>(DebtTypeEnum.Borrowed);
  const [counterpartyName, setCounterpartyName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [color, setColor] = useState(COLORS[0]);
  const [description, setDescription] = useState("");
  const [walletId, setWalletId] = useState<number | "">(wallets[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  const createDebt = useMutationCreateDebt();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amt = Number(amount);
    if (!counterpartyName.trim()) return setError("Enter a name.");
    if (!amt || amt <= 0) return setError("Enter a valid amount.");
    if (!date) return setError("Enter a date.");
    if (!walletId) return setError("Select a wallet.");

    try {
      await createDebt.mutateAsync({
        type,
        counterparty_name: counterpartyName.trim(),
        amount: amt,
        date,
        color,
        description: description || undefined,
        wallet_id: walletId as number,
      });
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    }
  }

  const inputCls =
    "w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500";
  const selectCls =
    "w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500";
  const labelCls = "block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Add Debt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-neutral-800 rounded-xl mb-5">
          {([DebtTypeEnum.Borrowed, DebtTypeEnum.Lent] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                type === t
                  ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200"
              }`}
            >
              {t === DebtTypeEnum.Borrowed ? "I Borrowed" : "I Lent"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>
              {type === DebtTypeEnum.Borrowed ? "Who did you borrow from?" : "Who did you lend to?"}
            </label>
            <input
              type="text"
              value={counterpartyName}
              onChange={(e) => setCounterpartyName(e.target.value)}
              placeholder="Name / Organization"
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
                placeholder="0.00"
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
            <label className={labelCls}>Wallet</label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(Number(e.target.value))}
              className={selectCls}
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
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
              disabled={createDebt.isPending}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50"
            >
              {createDebt.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

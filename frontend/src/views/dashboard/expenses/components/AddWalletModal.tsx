import { useState } from "react";
import { WalletTypeEnum } from "@/schemas";
import { useMutationCreateWallet } from "@/api/mutations";
import Spinner from "@/components/common/Spinner";

interface Props {
  onClose: () => void;
}

export default function AddWalletModal({ onClose }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<WalletTypeEnum>(WalletTypeEnum.Bank);
  const [creditLimit, setCreditLimit] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutationCreateWallet();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Name is required.");

    try {
      await mutation.mutateAsync({
        name: name.trim(),
        type,
        credit_limit: type === WalletTypeEnum.Credit && creditLimit ? Number(creditLimit) : undefined,
        initial_balance: type !== WalletTypeEnum.Credit && initialBalance ? Number(initialBalance) : undefined,
      });
      onClose();
    } catch {
      setError("Failed to create wallet. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Add Wallet</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HDFC Savings"
              className="w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5">Type</label>
            <div className="flex gap-2">
              {([WalletTypeEnum.Bank, WalletTypeEnum.Cash, WalletTypeEnum.Credit] as WalletTypeEnum[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${
                    type === t
                      ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black"
                      : "border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-600"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {type === WalletTypeEnum.Credit && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5">Credit Limit (₹)</label>
              <input
                type="number"
                min="0"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="e.g. 100000"
                className="w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500"
              />
            </div>
          )}

          {type !== WalletTypeEnum.Credit && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5">Initial Balance (₹)</label>
              <input
                type="number"
                min="0"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
          )}

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
              {mutation.isPending ? <><Spinner size="sm" /> Creating…</> : "Create Wallet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

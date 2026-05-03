import { useState } from "react";
import type { WalletWithBalance } from "@/schemas";
import { WalletTypeEnum } from "@/schemas";
import {
  useMutationUpdateWallet,
  useMutationDeleteWallet,
  useGetWalletRecordCount,
} from "@/api/mutations";

interface Props {
  wallet: WalletWithBalance;
  onClose: () => void;
}

export default function EditWalletModal({ wallet, onClose }: Props) {
  const [name, setName] = useState(wallet.name);
  const [type, setType] = useState<WalletTypeEnum>(wallet.type);
  const [creditLimit, setCreditLimit] = useState(wallet.credit_limit?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState<"idle" | "checking" | "confirm">("idle");
  const [recordCount, setRecordCount] = useState(0);

  const updateMutation = useMutationUpdateWallet(wallet.id);
  const deleteMutation = useMutationDeleteWallet(wallet.id);
  const getRecordCount = useGetWalletRecordCount();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Name is required.");
    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        type,
        credit_limit: type === WalletTypeEnum.Credit && creditLimit ? Number(creditLimit) : null,
      });
      onClose();
    } catch {
      setError("Failed to update wallet. Please try again.");
    }
  }

  async function handleDeleteClick() {
    setDeleteStep("checking");
    try {
      const res = await getRecordCount(wallet.id);
      setRecordCount(res.count);
      setDeleteStep("confirm");
    } catch {
      setDeleteStep("idle");
      setError("Could not check wallet records.");
    }
  }

  async function handleConfirmDelete() {
    try {
      await deleteMutation.mutateAsync();
      onClose();
    } catch {
      setError("Failed to delete wallet. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Edit Wallet</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {deleteStep === "confirm" ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                Delete "{wallet.name}"?
              </p>
              {recordCount > 0 ? (
                <p className="text-xs text-red-600 dark:text-red-400">
                  This wallet has {recordCount} linked record{recordCount !== 1 ? "s" : ""} (expenses, income, transfers). They will remain but the wallet will be hidden.
                </p>
              ) : (
                <p className="text-xs text-red-600 dark:text-red-400">
                  This wallet has no linked records.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteStep("idle")}
                className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500"
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
                  className="w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500"
                />
              </div>
            )}

            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={deleteStep === "checking"}
                className="py-2 px-4 rounded-lg text-sm font-medium border border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
              >
                {deleteStep === "checking" ? "…" : "Delete"}
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
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

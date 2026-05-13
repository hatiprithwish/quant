import { useNavigate } from "react-router-dom";
import { useGetDebts } from "@/api/cachedQueries";
import { DebtStatusEnum } from "@/schemas";

export default function LendingTab() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetDebts();

  const lent = data?.lent ?? [];
  const borrowed = data?.borrowed ?? [];

  const totalLent = lent
    .filter((d) => d.status !== DebtStatusEnum.Settled)
    .reduce((s, d) => s + (d.amount - d.paid_amount), 0);

  const totalBorrowed = borrowed
    .filter((d) => d.status !== DebtStatusEnum.Settled)
    .reduce((s, d) => s + (d.amount - d.paid_amount), 0);

  const activeLent = lent.filter((d) => d.status !== DebtStatusEnum.Settled).length;
  const activeBorrowed = borrowed.filter((d) => d.status !== DebtStatusEnum.Settled).length;

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400 dark:text-neutral-500 text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        <button
          onClick={() => navigate("/money/debt?type=lent")}
          className="group bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6 text-left hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all"
        >
          <div className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase mb-3">
            You Lent
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            ₹{totalLent.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-gray-400 dark:text-neutral-500">
            {activeLent} active {activeLent === 1 ? "entry" : "entries"}
          </div>
          <div className="mt-4 text-xs text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
            View details →
          </div>
        </button>

        <button
          onClick={() => navigate("/money/debt?type=borrowed")}
          className="group bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6 text-left hover:border-red-300 dark:hover:border-red-800 hover:shadow-sm transition-all"
        >
          <div className="text-[10px] font-bold tracking-widest text-red-400 uppercase mb-3">
            You Owe
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            ₹{totalBorrowed.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-gray-400 dark:text-neutral-500">
            {activeBorrowed} active {activeBorrowed === 1 ? "entry" : "entries"}
          </div>
          <div className="mt-4 text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
            View details →
          </div>
        </button>
      </div>
    </div>
  );
}

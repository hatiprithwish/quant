import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetDebts, useGetWallets } from "@/api/cachedQueries";
import type { DebtEntry } from "@/schemas";
import { DebtStatusEnum } from "@/schemas";
import AddDebtModal from "@/views/dashboard/expenses/components/AddDebtModal";
import EditDebtModal from "@/views/dashboard/expenses/components/EditDebtModal";
import Spinner from "@/components/common/Spinner";

type FilterType = "lent" | "borrowed";
type StatusFilter = "active" | "all";

function fmtDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][parseInt(m) - 1]}`;
}

function DebtCard({
  entry,
  onEdit,
}: {
  entry: DebtEntry;
  onEdit: (e: DebtEntry) => void;
}) {
  const remaining = entry.amount - entry.paid_amount;
  const pct = Math.min((entry.paid_amount / entry.amount) * 100, 100);
  const statusLabel =
    entry.status === DebtStatusEnum.Pending
      ? "Pending"
      : entry.status === DebtStatusEnum.InMotion
        ? "In Motion"
        : "Settled";

  return (
    <button
      type="button"
      onClick={() => onEdit(entry)}
      className="group w-full text-left bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 hover:border-gray-300 dark:hover:border-neutral-700 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {entry.counterparty_name}
            </div>
            <div className="text-[10px] text-gray-400 dark:text-neutral-500 mt-0.5">
              {statusLabel} · {fmtDate(entry.date)}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-gray-900 dark:text-white">
            ₹{remaining.toLocaleString("en-IN")}
          </div>
          <div className="text-[10px] text-gray-400 dark:text-neutral-500 mt-0.5">
            of ₹{entry.amount.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <div className="w-full h-1 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: entry.color }}
        />
      </div>

      {entry.description && (
        <div className="text-[10px] text-gray-400 dark:text-neutral-500 mt-2 truncate">
          {entry.description}
        </div>
      )}

      <div className="text-[10px] text-gray-300 dark:text-neutral-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        Click to edit →
      </div>
    </button>
  );
}

export default function DebtDetailPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = searchParams.get("type") as FilterType | null;
  const statusParam = searchParams.get("status") as StatusFilter | null;
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    typeParam ?? "lent",
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    statusParam === "all" ? "all" : "active",
  );
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtEntry | null>(null);

  const { data, isLoading } = useGetDebts();
  const { data: walletsData } = useGetWallets();

  const wallets = walletsData?.wallets ?? [];
  const lent = data?.lent ?? [];
  const borrowed = data?.borrowed ?? [];

  const entries = activeFilter === "lent" ? lent : borrowed;
  const filtered =
    statusFilter === "active"
      ? entries.filter((e) => e.status !== DebtStatusEnum.Settled)
      : entries;

  const totalRemaining = filtered.reduce(
    (s, e) => s + (e.amount - e.paid_amount),
    0,
  );

  function switchFilter(f: FilterType) {
    setActiveFilter(f);
    setSearchParams((prev) => {
      prev.set("type", f);
      return prev;
    });
  }

  function switchStatus(s: StatusFilter) {
    setStatusFilter(s);
    setSearchParams((prev) => {
      prev.set("status", s);
      return prev;
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate(-1)}
              className="text-xs text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors"
            >
              ←
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeFilter === "lent" ? "Money You Lent" : "Money You Owe"}
          </h1>
          <p className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">
            ₹{totalRemaining.toLocaleString("en-IN")} outstanding ·{" "}
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <button
          onClick={() => setShowAddDebt(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 mb-5">
        <div className="flex">
          <button
            onClick={() => switchFilter("lent")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeFilter === "lent"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300"
            }`}
          >
            You Lent
          </button>
          <button
            onClick={() => switchFilter("borrowed")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeFilter === "borrowed"
                ? "border-red-400 text-red-500 dark:text-red-400"
                : "border-transparent text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300"
            }`}
          >
            You Owe
          </button>
        </div>
        <div className="flex items-center gap-1 pb-2">
          {(["active", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => switchStatus(s)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                statusFilter === s
                  ? "bg-gray-900 dark:bg-white text-white dark:text-black"
                  : "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              {s === "active" ? "Active" : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-neutral-500 text-sm">
          No {statusFilter === "active" ? "active " : ""}
          {activeFilter === "lent" ? "lent" : "borrowed"} entries.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((e) => (
            <DebtCard key={e.id} entry={e} onEdit={setEditingDebt} />
          ))}
        </div>
      )}

      {showAddDebt && (
        <AddDebtModal wallets={wallets} onClose={() => setShowAddDebt(false)} />
      )}
      {editingDebt && (
        <EditDebtModal
          debt={editingDebt}
          wallets={wallets}
          onClose={() => setEditingDebt(null)}
        />
      )}
    </div>
  );
}

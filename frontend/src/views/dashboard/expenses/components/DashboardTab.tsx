import { useState } from "react";
import type { GetExpenseSummaryResponse, WalletWithBalance, BudgetWithSpent, DebtEntry, RecurringTransactionItem } from "@/schemas";
import { WalletTypeEnum, BudgetPeriodEnum, DebtStatusEnum } from "@/schemas";
import {
  useGetWallets,
  useGetBudgets,
  useGetDebts,
  useGetRecurringTransactions,
} from "@/api/cachedQueries";
import AddWalletModal from "./AddWalletModal";
import EditWalletModal from "./EditWalletModal";

interface Props {
  data: GetExpenseSummaryResponse | null;
}

function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split("T")[0];
}

function startOfQuarter() {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3);
  d.setMonth(q * 3, 1);
  return d.toISOString().split("T")[0];
}

function startOfYear() {
  const d = new Date();
  d.setMonth(0, 1);
  return d.toISOString().split("T")[0];
}

const periodStartDate: Record<BudgetPeriodEnum, () => string> = {
  [BudgetPeriodEnum.Weekly]: startOfWeek,
  [BudgetPeriodEnum.Monthly]: startOfMonth,
  [BudgetPeriodEnum.Quarterly]: startOfQuarter,
  [BudgetPeriodEnum.Yearly]: startOfYear,
};

function fmtDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m) - 1]}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function WalletCard({
  wallet,
  onEdit,
}: {
  wallet: WalletWithBalance;
  onEdit: (w: WalletWithBalance) => void;
}) {
  const typeLabel =
    wallet.type === WalletTypeEnum.Bank ? "BANK" :
    wallet.type === WalletTypeEnum.Cash ? "CASH" : "CREDIT";

  const typeColor =
    wallet.type === WalletTypeEnum.Bank
      ? "text-blue-500 dark:text-blue-400"
      : wallet.type === WalletTypeEnum.Cash
      ? "text-emerald-500 dark:text-emerald-400"
      : "text-orange-500 dark:text-orange-400";

  const usedPct = wallet.credit_limit && wallet.credit_limit > 0
    ? Math.round((Math.abs(wallet.balance) / wallet.credit_limit) * 100)
    : null;

  return (
    <div className="group relative bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 min-w-0">
      <button
        onClick={() => onEdit(wallet)}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 dark:text-neutral-600 hover:text-gray-500 dark:hover:text-neutral-400"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M10 2l2 2-7 7H3v-2l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className={`text-[10px] font-bold tracking-widest mb-2 ${typeColor}`}>
        {typeLabel}
      </div>
      <div className="text-xs text-gray-500 dark:text-neutral-400 mb-1">{wallet.name}</div>
      <div className="text-xl font-bold text-gray-900 dark:text-white">
        ₹{wallet.balance.toLocaleString("en-IN")}
      </div>
      {wallet.type === WalletTypeEnum.Credit && usedPct !== null && wallet.credit_limit && (
        <div className="mt-2 space-y-1">
          <div className="w-full h-1 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-400 rounded-full"
              style={{ width: `${Math.min(usedPct, 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-gray-400 dark:text-neutral-500">
            Used {usedPct}% · Limit ₹{(wallet.credit_limit / 1000).toFixed(0)}k
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4">
      <div className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-neutral-500 uppercase mb-2">
        {label}
      </div>
      <div
        className={`text-2xl font-bold ${
          positive === true
            ? "text-emerald-500"
            : positive === false
            ? "text-red-500"
            : "text-gray-900 dark:text-white"
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-gray-400 dark:text-neutral-500 mt-1">{sub}</div>
      )}
    </div>
  );
}

function BudgetRow({ budget }: { budget: BudgetWithSpent }) {
  const pct = Math.min((budget.spent / budget.amount) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: budget.color }} />
          <span className="text-gray-700 dark:text-neutral-200">{budget.label}</span>
        </div>
        <span className="text-gray-400 dark:text-neutral-500">
          ₹{budget.spent.toLocaleString("en-IN")} / ₹{budget.amount.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: budget.color }} />
      </div>
    </div>
  );
}

function DebtRow({ entry }: { entry: DebtEntry }) {
  const remaining = entry.amount - entry.paid_amount;
  const statusLabel =
    entry.status === DebtStatusEnum.Pending ? "Pending" :
    entry.status === DebtStatusEnum.InMotion ? "In Motion" : "Settled";
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">{entry.counterparty_name}</div>
        <div className="text-[10px] text-gray-400 dark:text-neutral-500">
          {statusLabel}{entry.due_date ? ` · ${fmtDate(entry.due_date)}` : ""}
        </div>
      </div>
      <div className="text-sm font-semibold text-gray-900 dark:text-white">₹{remaining.toLocaleString("en-IN")}</div>
    </div>
  );
}

function RecurringRow({ item }: { item: RecurringTransactionItem }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600" />
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
          <div className="text-[10px] text-gray-400 dark:text-neutral-500">
            {item.period.charAt(0).toUpperCase() + item.period.slice(1)} · Next: {fmtDate(item.next_date)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">₹{item.amount.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DashboardTab({ data }: Props) {
  const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriodEnum>(BudgetPeriodEnum.Monthly);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletWithBalance | null>(null);

  const { data: walletsData } = useGetWallets();
  const { data: budgetsData } = useGetBudgets(budgetPeriod, periodStartDate[budgetPeriod]());
  const { data: debtsData } = useGetDebts();
  const { data: recurringData } = useGetRecurringTransactions();

  const wallets = walletsData?.wallets ?? [];
  const budgets = budgetsData?.budgets ?? [];
  const lent = debtsData?.lent ?? [];
  const borrowed = debtsData?.borrowed ?? [];
  const recurring = recurringData?.items ?? [];

  const monthSpent = data?.grandTotal ?? 0;
  const budgetTotal = budgets.reduce((s, b) => s + b.amount, 0);
  const budgetRemaining = budgetTotal - monthSpent;
  const netLent =
    lent.reduce((s, l) => s + (l.amount - l.paid_amount), 0) -
    borrowed.reduce((s, o) => s + (o.amount - o.paid_amount), 0);
  const recurringTotal = recurring.reduce((s, r) => s + r.amount, 0);

  const vsPreviousSub = data?.vsPrevious != null
    ? `${data.vsPrevious >= 0 ? "↑" : "↓"} ${Math.abs(data.vsPrevious).toFixed(0)}% vs last period`
    : undefined;

  return (
    <div className="space-y-5">
      {/* Wallet cards */}
      <div className="grid grid-cols-4 gap-3">
        {wallets.map((w) => (
          <WalletCard key={w.id} wallet={w} onEdit={setEditingWallet} />
        ))}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-gray-200 dark:border-neutral-700 p-4 flex items-center justify-center">
          <button
            onClick={() => setShowAddWallet(true)}
            className="text-xs text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors"
          >
            + Add Wallet
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Month Spent" value={`₹${monthSpent.toLocaleString("en-IN")}`} sub={vsPreviousSub} />
        <StatCard label="Budget Remaining" value={`₹${budgetRemaining.toLocaleString("en-IN")}`} sub={budgetTotal > 0 ? `/ ₹${budgetTotal.toLocaleString("en-IN")} total` : undefined} />
        <StatCard label="Net Lent" value={`${netLent >= 0 ? "+" : ""}₹${Math.abs(netLent).toLocaleString("en-IN")}`} sub="Awaiting repayment" positive={netLent >= 0} />
        <StatCard label="Recurring / Mo" value={`₹${recurringTotal.toLocaleString("en-IN")}`} sub={recurring.length > 0 ? `${recurring.length} active` : undefined} />
      </div>

      {/* Bottom two-column section */}
      <div className="grid grid-cols-2 gap-4">
        {/* Monthly Budgets */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Budgets</h3>
            <div className="flex items-center gap-1">
              {[
                { label: "Weekly", value: BudgetPeriodEnum.Weekly },
                { label: "Monthly", value: BudgetPeriodEnum.Monthly },
                { label: "Quarterly", value: BudgetPeriodEnum.Quarterly },
                { label: "Yearly", value: BudgetPeriodEnum.Yearly },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setBudgetPeriod(p.value)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    budgetPeriod === p.value
                      ? "bg-gray-900 dark:bg-white text-white dark:text-black"
                      : "text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3.5">
            {budgets.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-neutral-500">No budgets set.</p>
            ) : (
              budgets.map((b) => <BudgetRow key={b.id} budget={b} />)
            )}
          </div>
          <button className="w-full py-2 rounded-full border border-dashed border-gray-200 dark:border-neutral-700 text-xs text-gray-400 dark:text-neutral-500 hover:border-gray-300 dark:hover:border-neutral-600 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors">
            + New Budget
          </button>
        </div>

        {/* Right column: Lending & Recurring */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Lending & Borrowing</h3>
              <button className="text-xs text-gray-400 dark:text-neutral-500 border border-gray-200 dark:border-neutral-700 rounded px-2 py-0.5 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors">
                + Add
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase mb-2">You Lent</div>
                {lent.length === 0 ? <p className="text-xs text-gray-400 dark:text-neutral-500">Nothing lent.</p> : lent.map((l) => <DebtRow key={l.id} entry={l} />)}
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-red-400 uppercase mb-2">You Owe</div>
                {borrowed.length === 0 ? <p className="text-xs text-gray-400 dark:text-neutral-500">Nothing owed.</p> : borrowed.map((o) => <DebtRow key={o.id} entry={o} />)}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recurring</h3>
              <button className="text-xs text-gray-400 dark:text-neutral-500 border border-gray-200 dark:border-neutral-700 rounded px-2 py-0.5 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors">
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {recurring.length === 0 ? <p className="text-xs text-gray-400 dark:text-neutral-500">No recurring transactions.</p> : recurring.map((r) => <RecurringRow key={r.id} item={r} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddWallet && <AddWalletModal onClose={() => setShowAddWallet(false)} />}
      {editingWallet && <EditWalletModal wallet={editingWallet} onClose={() => setEditingWallet(null)} />}
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useGetExpenses,
  useGetTransactions,
  useGetWallets,
} from "@/api/cachedQueries";
import DashboardTab from "./components/DashboardTab";
import TransactionsTab from "./components/TransactionsTab";
import CategoriesTab from "./components/CategoriesTab";
import LendingTab from "./components/LendingTab";
import InvestmentsTab from "./components/InvestmentsTab";
import AddEntryModal from "./components/AddEntryModal";

function today() {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
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

function fmtDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][parseInt(m) - 1]}`;
}

const PRESETS = [
  { label: "Today", from: () => today(), to: () => today() },
  { label: "7 days", from: () => daysAgo(6), to: () => today() },
  { label: "Month", from: () => startOfMonth(), to: () => today() },
  { label: "Quarter", from: () => startOfQuarter(), to: () => today() },
  { label: "Year", from: () => startOfYear(), to: () => today() },
];

type Tab = "dashboard" | "transactions" | "categories" | "lending" | "investments";

function DateRangeDropdown({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (f: string, t: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalFrom(from);
  }, [from]);
  useEffect(() => {
    setLocalTo(to);
  }, [to]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label =
    from === to ? fmtDate(from) : `${fmtDate(from)} – ${fmtDate(to)}`;

  function commitFrom(val: string) {
    setLocalFrom(val);
    if (val && localTo && val <= localTo) onChange(val, localTo);
  }

  function commitTo(val: string) {
    setLocalTo(val);
    if (val && localFrom && localFrom <= val) onChange(localFrom, val);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors whitespace-nowrap"
      >
        {label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className="opacity-50"
        >
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-lg p-3"
          style={{ minWidth: "16rem", width: "max-content" }}
        >
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESETS.map((p) => {
              const pFrom = p.from();
              const pTo = p.to();
              const active = from === pFrom && to === pTo;
              return (
                <button
                  key={p.label}
                  onClick={() => {
                    onChange(pFrom, pTo);
                    setOpen(false);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? "bg-gray-900 dark:bg-white text-white dark:text-black"
                      : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={localFrom}
              max={localTo}
              onChange={(e) => commitFrom(e.target.value)}
              className="flex-1 min-w-0 text-xs border border-gray-200 dark:border-neutral-700 rounded-md px-2 py-1.5 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500"
            />
            <span className="text-gray-300 dark:text-neutral-600 text-xs shrink-0">
              →
            </span>
            <input
              type="date"
              value={localTo}
              min={localFrom}
              max={today()}
              onChange={(e) => commitTo(e.target.value)}
              className="flex-1 min-w-0 text-xs border border-gray-200 dark:border-neutral-700 rounded-md px-2 py-1.5 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

const VALID_TABS: Tab[] = ["dashboard", "transactions", "categories", "lending", "investments"];

export default function ExpensesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const tab: Tab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "dashboard";

  function setTab(t: Tab) {
    setSearchParams((prev) => { prev.set("tab", t); return prev; });
  }

  const [from, setFrom] = useState(startOfMonth());
  const [to, setTo] = useState(today());
  const [showAddEntry, setShowAddEntry] = useState(false);

  const {
    data: expenseData,
    isLoading: expenseLoading,
    error: expenseError,
  } = useGetExpenses(from, to);
  const {
    data: txData,
    isLoading: txLoading,
    error: txError,
  } = useGetTransactions(from, to);
  const { data: walletsData } = useGetWallets();

  const wallets = walletsData?.wallets ?? [];
  const isLoading =
    tab === "dashboard"
      ? expenseLoading
      : tab === "transactions"
        ? txLoading
        : false;
  const error =
    tab === "dashboard"
      ? expenseError
      : tab === "transactions"
        ? txError
        : null;
  const showDateFilter = tab !== "lending" && tab !== "investments";

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Money
          </h1>
          <p className="text-xs text-gray-400 dark:text-neutral-500 mt-0.5">
            {new Date(from + "T00:00:00").toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}{" "}
            · Monthly
          </p>
        </div>
        <div className="flex items-center gap-3">
          {showDateFilter && (
            <DateRangeDropdown
              from={from}
              to={to}
              onChange={(f, t) => {
                setFrom(f);
                setTo(t);
              }}
            />
          )}
          {tab !== "lending" && tab !== "investments" && (
            <button
              onClick={() => setShowAddEntry(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors whitespace-nowrap"
            >
              + Add Entry
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-neutral-800 mb-5">
        <button
          onClick={() => setTab("dashboard")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "dashboard"
              ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
              : "border-transparent text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300"
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setTab("transactions")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "transactions"
              ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
              : "border-transparent text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300"
          }`}
        >
          All Transactions
        </button>
        <button
          onClick={() => setTab("categories")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "categories"
              ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
              : "border-transparent text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300"
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setTab("lending")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "lending"
              ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
              : "border-transparent text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300"
          }`}
        >
          Lending
        </button>
        <button
          onClick={() => setTab("investments")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "investments"
              ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
              : "border-transparent text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300"
          }`}
        >
          Investments
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-8 text-gray-400 dark:text-neutral-500 text-sm">
          Loading…
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          Failed to load data.
        </div>
      )}

      {!isLoading && !error && (
        <>
          {tab === "dashboard" && <DashboardTab data={expenseData ?? null} />}
          {tab === "transactions" && (
            <TransactionsTab
              data={txData ?? null}
              wallets={wallets}
              from={from}
              to={to}
            />
          )}
          {tab === "categories" && <CategoriesTab />}
          {tab === "lending" && <LendingTab />}
          {tab === "investments" && <InvestmentsTab />}
        </>
      )}

      {showAddEntry && (
        <AddEntryModal
          wallets={wallets}
          from={from}
          to={to}
          onClose={() => setShowAddEntry(false)}
        />
      )}
    </div>
  );
}

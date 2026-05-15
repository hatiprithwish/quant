import { useState } from "react";
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
import Spinner from "@/components/common/Spinner";
import DateRangeDropdown, { drToday, getPresetRange } from "@/components/common/DateRangeDropdown";


// ── Types ───────────────────────────────────────────────────────────────────────

export type MoneyTab = "dashboard" | "transactions" | "categories" | "lending" | "investments";

const MONEY_SECTIONS: { tab: MoneyTab; label: string; sub: string; glyph: string }[] = [
  { tab: "dashboard",    label: "OVERVIEW",   sub: "command center",  glyph: "◈" },
  { tab: "transactions", label: "LEDGER",     sub: "all entries",     glyph: "≡" },
  { tab: "categories",   label: "CATEGORIES", sub: "budget & tags",   glyph: "◐" },
  { tab: "lending",      label: "DEBTS",      sub: "lent & owed",     glyph: "⇄" },
  { tab: "investments",  label: "PORTFOLIO",  sub: "assets & growth", glyph: "△" },
];

// ── Page header ────────────────────────────────────────────────────────────────

function PageHeader({
  tab, from, to, onChange, showDateFilter, onAddEntry,
}: {
  tab: MoneyTab; from: string; to: string;
  onChange: (f: string, t: string) => void;
  showDateFilter: boolean; onAddEntry: () => void;
}) {
  const section = MONEY_SECTIONS.find(s => s.tab === tab);

  return (
    <div style={{
      borderBottom: "1px solid rgba(245,158,11,0.08)",
      padding: "14px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "rgba(8,6,2,0.4)",
      backdropFilter: "blur(2px)",
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{
          fontSize: 16, color: "rgba(245,158,11,0.5)",
          textShadow: "0 0 10px rgba(245,158,11,0.3)",
        }}>{section?.glyph}</span>
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 11, letterSpacing: "0.22em", fontWeight: 700,
            color: "#ffffff",
          }}>{section?.label ?? tab.toUpperCase()}</div>
          <div style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 8, letterSpacing: "0.12em",
            color: "rgba(245,158,11,0.4)",
            marginTop: 1,
          }}>{section?.sub}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {showDateFilter && (
          <DateRangeDropdown accent="#f59e0b" panelBg="#0d0d0d" align="right" from={from} to={to} onChange={onChange} />
        )}
        {tab !== "lending" && tab !== "investments" && (
          <button
            onClick={onAddEntry}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px",
              background: "#f59e0b",
              border: "none",
              borderRadius: 4,
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: 10, letterSpacing: "0.1em", fontWeight: 700,
              color: "#000", cursor: "pointer",
              boxShadow: "0 0 16px rgba(245,158,11,0.35)",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(245,158,11,0.55)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(245,158,11,0.35)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            + LOG ENTRY
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function ExpensesPage({ tab }: { tab: MoneyTab }) {
  const [from, setFrom] = useState(() => getPresetRange("thisMonth").from);
  const [to, setTo] = useState(drToday);
  const [showAddEntry, setShowAddEntry] = useState(false);

  const { data: expenseData, isLoading: expenseLoading, error: expenseError } = useGetExpenses(from, to);
  const { data: txData, isLoading: txLoading, error: txError } = useGetTransactions(from, to);
  const { data: walletsData } = useGetWallets();

  const wallets = walletsData?.wallets ?? [];
  const isLoading = tab === "dashboard" ? expenseLoading : tab === "transactions" ? txLoading : false;
  const error = tab === "dashboard" ? expenseError : tab === "transactions" ? txError : null;
  const showDateFilter = tab !== "lending" && tab !== "investments";

  return (
    <>
      {/* Inject fonts + global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&display=swap');

        .money-shell {
          display: flex;
          flex: 1;
          height: 100%;
          min-height: 0;
          background: #080602;
          position: relative;
          overflow: hidden;
        }
        .money-shell::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(245,158,11,0.007) 2px,
            rgba(245,158,11,0.007) 4px
          );
          pointer-events: none;
          z-index: 0;
        }
        .money-shell::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 15% 50%, rgba(245,158,11,0.04) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 20%, rgba(245,158,11,0.02) 0%, transparent 45%);
          pointer-events: none;
          z-index: 0;
        }
        .money-content-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          position: relative;
          z-index: 1;
          overflow: visible;
        }
        .money-tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          position: relative;
        }
        .money-tab-content::-webkit-scrollbar { width: 4px; }
        .money-tab-content::-webkit-scrollbar-track { background: transparent; }
        .money-tab-content::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.2); border-radius: 2px; }
        .money-tab-content::-webkit-scrollbar-thumb:hover { background: rgba(245,158,11,0.4); }

        /* Override child component styles for dark money theme */
        .money-tab-content .bg-white,
        .money-tab-content .dark\\:bg-neutral-900 {
          background: rgba(15,12,4,0.8) !important;
          border-color: rgba(245,158,11,0.12) !important;
        }
        .money-tab-content .border-gray-200,
        .money-tab-content .dark\\:border-neutral-800 {
          border-color: rgba(245,158,11,0.12) !important;
        }
        .money-tab-content h3 {
          font-family: 'JetBrains Mono','Fira Code',monospace !important;
          letter-spacing: 0.12em !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
        }

        @keyframes moneyPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(245,158,11,0.6); }
          50% { opacity: 0.5; box-shadow: 0 0 12px rgba(245,158,11,0.9); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .money-section-enter {
          animation: fadeSlideIn 0.2s ease-out forwards;
        }
      `}</style>

      <div className="money-shell">
        <div className="money-content-area">
          <PageHeader
            tab={tab} from={from} to={to}
            onChange={(f, t) => { setFrom(f); setTo(t); }}
            showDateFilter={showDateFilter}
            onAddEntry={() => setShowAddEntry(true)}
          />

          <div className="money-tab-content">
            {isLoading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <Spinner />
                  <div style={{
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    fontSize: 9, letterSpacing: "0.2em",
                    color: "rgba(245,158,11,0.4)",
                  }}>LOADING...</div>
                </div>
              </div>
            )}

            {error && (
              <div style={{
                border: "1px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.08)",
                borderRadius: 6, padding: "12px 16px",
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 10, letterSpacing: "0.08em",
                color: "rgba(239,68,68,0.8)",
              }}>
                ✕ FAILED TO LOAD DATA
              </div>
            )}

            {!isLoading && !error && (
              <div className="money-section-enter">
                {tab === "dashboard"    && <DashboardTab data={expenseData ?? null} />}
                {tab === "transactions" && <TransactionsTab data={txData ?? null} wallets={wallets} from={from} to={to} />}
                {tab === "categories"   && <CategoriesTab />}
                {tab === "lending"      && <LendingTab />}
                {tab === "investments"  && <InvestmentsTab />}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddEntry && (
        <AddEntryModal wallets={wallets} from={from} to={to} onClose={() => setShowAddEntry(false)} />
      )}
    </>
  );
}

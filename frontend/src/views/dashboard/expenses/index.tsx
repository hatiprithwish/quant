import { useState } from "react";
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
import Spinner from "@/components/common/Spinner";
import DateRangeDropdown, { drToday, getPresetRange } from "@/components/common/DateRangeDropdown";


// ── Types ───────────────────────────────────────────────────────────────────────

type Tab = "dashboard" | "transactions" | "categories" | "lending" | "investments";
const VALID_TABS: Tab[] = ["dashboard", "transactions", "categories", "lending", "investments"];

// ── Inner nav config ─────────────────────────────────────────────────────────────

const MONEY_SECTIONS: { tab: Tab; label: string; sub: string; glyph: string; xp: number }[] = [
  { tab: "dashboard",    label: "OVERVIEW",     sub: "command center", glyph: "◈", xp: 100 },
  { tab: "transactions", label: "LEDGER",       sub: "all entries",    glyph: "≡", xp: 85  },
  { tab: "categories",   label: "CATEGORIES",   sub: "budget & tags",  glyph: "◐", xp: 72  },
  { tab: "lending",      label: "DEBTS",        sub: "lent & owed",    glyph: "⇄", xp: 45  },
  { tab: "investments",  label: "PORTFOLIO",    sub: "assets & growth",glyph: "△", xp: 90  },
];

// ── Inner Sidebar ──────────────────────────────────────────────────────────────

function MoneyRail({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <aside style={{
      width: 160,
      flexShrink: 0,
      background: "rgba(8,6,2,0.7)",
      borderRight: "1px solid rgba(245,158,11,0.1)",
      display: "flex",
      flexDirection: "column",
      padding: "16px 0",
      position: "relative",
      backdropFilter: "blur(4px)",
    }}>
      {/* ambient glow behind rail */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 20%, rgba(245,158,11,0.03) 0%, transparent 70%)",
      }} />

      <div style={{
        padding: "0 12px 12px",
        borderBottom: "1px solid rgba(245,158,11,0.08)",
        marginBottom: 8,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 8, letterSpacing: "0.22em",
          color: "rgba(245,158,11,0.4)",
          marginBottom: 2,
        }}>SECTOR</div>
        <div style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 11, letterSpacing: "0.18em", fontWeight: 700,
          color: "#f59e0b",
          textShadow: "0 0 12px rgba(245,158,11,0.5)",
        }}>FINANCE</div>
      </div>

      <nav style={{ flex: 1, padding: "0 6px", display: "flex", flexDirection: "column", gap: 1 }}>
        {MONEY_SECTIONS.map(section => {
          const active = tab === section.tab;
          return (
            <button
              key={section.tab}
              onClick={() => setTab(section.tab)}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "flex-start",
                padding: "8px 8px",
                background: active ? "rgba(245,158,11,0.1)" : "transparent",
                borderLeft: `2px solid ${active ? "#f59e0b" : "transparent"}`,
                borderRadius: "0 4px 4px 0",
                border: "none",
                borderLeftWidth: 2,
                borderLeftStyle: "solid",
                borderLeftColor: active ? "#f59e0b" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "all 0.15s",
                position: "relative",
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.05)";
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
                <span style={{
                  fontSize: 10, color: active ? "#f59e0b" : "rgba(245,158,11,0.3)",
                  transition: "color 0.15s", flexShrink: 0,
                  textShadow: active ? "0 0 8px rgba(245,158,11,0.6)" : "none",
                }}>{section.glyph}</span>
                <span style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: 9, letterSpacing: "0.14em", fontWeight: 700,
                  color: active ? "#fff" : "rgba(255,255,255,0.35)",
                  transition: "color 0.15s", lineHeight: 1.3, flex: 1,
                }}>{section.label}</span>
                {active && (
                  <div style={{
                    width: 3, height: 3, borderRadius: "50%",
                    background: "#f59e0b",
                    boxShadow: "0 0 6px #f59e0b",
                    flexShrink: 0,
                  }} />
                )}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 7, letterSpacing: "0.1em",
                color: active ? "rgba(245,158,11,0.6)" : "rgba(255,255,255,0.18)",
                marginLeft: 16, marginTop: 1,
                transition: "color 0.15s",
              }}>{section.sub}</div>
            </button>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div style={{
        padding: "10px 12px 0",
        borderTop: "1px solid rgba(245,158,11,0.08)",
        marginTop: 8,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 7, letterSpacing: "0.1em",
          color: "rgba(245,158,11,0.25)",
          lineHeight: 1.6,
        }}>
          <div>SYS · MONEY</div>
          <div>STATUS · ONLINE</div>
        </div>
      </div>
    </aside>
  );
}

// ── Page header ────────────────────────────────────────────────────────────────

function PageHeader({
  tab, from, to, onChange, showDateFilter, onAddEntry,
}: {
  tab: Tab; from: string; to: string;
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

export default function ExpensesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const tab: Tab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "dashboard";

  function setTab(t: Tab) {
    setSearchParams(prev => { prev.set("tab", t); return prev; });
  }

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
        {/* Inner rail — z above shell backgrounds */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <MoneyRail tab={tab} setTab={setTab} />
        </div>

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

import { useState } from "react";
import type {
  GetExpenseSummaryResponse,
  WalletWithBalance,
  BudgetWithSpent,
  RecurringTransactionItem,
} from "@/schemas";
import { WalletTypeEnum, BudgetPeriodEnum } from "@/schemas";
import {
  useGetWallets,
  useGetBudgets,
  useGetDebts,
  useGetRecurringTransactions,
  useGetInvestments,
} from "@/api/cachedQueries";
import AddWalletModal from "./AddWalletModal";
import EditWalletModal from "./EditWalletModal";
import AddRecurringTransactionModal from "./AddRecurringTransactionModal";
import AddBudgetModal from "./AddBudgetModal";
import EditBudgetModal from "./EditBudgetModal";

// ── Date helpers ─────────────────────────────────────────────────────────────

function startOfWeek() { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split("T")[0]; }
function startOfMonth() { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; }
function startOfQuarter() { const d = new Date(); const q = Math.floor(d.getMonth() / 3); d.setMonth(q * 3, 1); return d.toISOString().split("T")[0]; }
function startOfYear() { const d = new Date(); d.setMonth(0, 1); return d.toISOString().split("T")[0]; }

const periodStartDate: Record<BudgetPeriodEnum, () => string> = {
  [BudgetPeriodEnum.Weekly]: startOfWeek,
  [BudgetPeriodEnum.Monthly]: startOfMonth,
  [BudgetPeriodEnum.Quarterly]: startOfQuarter,
  [BudgetPeriodEnum.Yearly]: startOfYear,
};

function fmtDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}`;
}

function fmtMoney(n: number) { return `₹${Math.abs(n).toLocaleString("en-IN")}`; }

// ── Wallet card ───────────────────────────────────────────────────────────────

function WalletCard({ wallet, onEdit }: { wallet: WalletWithBalance; onEdit: (w: WalletWithBalance) => void }) {
  const [hovered, setHovered] = useState(false);

  const typeConfig = {
    [WalletTypeEnum.Bank]:   { label: "BANK",   accent: "#3b82f6", glyph: "▦" },
    [WalletTypeEnum.Cash]:   { label: "CASH",   accent: "#22c55e", glyph: "◈" },
    [WalletTypeEnum.Credit]: { label: "CREDIT", accent: "#f59e0b", glyph: "◉" },
  };
  const cfg = typeConfig[wallet.type];

  const usedPct = wallet.credit_limit && wallet.credit_limit > 0
    ? Math.min(Math.round((Math.abs(wallet.balance) / wallet.credit_limit) * 100), 100)
    : null;

  const isNegative = wallet.balance < 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onEdit(wallet)}
      style={{
        background: hovered ? "rgba(20,16,5,0.95)" : "rgba(12,10,3,0.8)",
        border: `1px solid ${hovered ? cfg.accent + "44" : "rgba(245,158,11,0.12)"}`,
        borderRadius: 8,
        padding: "16px",
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
        boxShadow: hovered ? `0 0 20px ${cfg.accent}18` : "none",
      }}
    >
      {/* Corner accent */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 40, height: 40,
        background: `linear-gradient(225deg, ${cfg.accent}22 0%, transparent 60%)`,
        pointerEvents: "none",
      }} />

      <div style={{
        display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
      }}>
        <span style={{ fontSize: 10, color: cfg.accent }}>{cfg.glyph}</span>
        <span style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 8, letterSpacing: "0.22em", fontWeight: 700,
          color: cfg.accent,
        }}>{cfg.label}</span>
      </div>

      <div style={{
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontSize: 10, letterSpacing: "0.08em",
        color: "rgba(255,255,255,0.4)",
        marginBottom: 4,
      }}>{wallet.name}</div>

      <div style={{
        fontFamily: "'Syne','JetBrains Mono',monospace",
        fontSize: 22, fontWeight: 800,
        color: isNegative ? "#ef4444" : "#ffffff",
        letterSpacing: "-0.02em", lineHeight: 1,
        textShadow: isNegative ? "0 0 20px rgba(239,68,68,0.3)" : "none",
      }}>
        {isNegative ? "−" : ""}{fmtMoney(wallet.balance)}
      </div>

      {usedPct !== null && wallet.credit_limit && (
        <div style={{ marginTop: 10 }}>
          <div style={{
            width: "100%", height: 2,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 1, overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${usedPct}%`,
              background: usedPct > 80 ? "#ef4444" : usedPct > 60 ? "#f59e0b" : "#22c55e",
              borderRadius: 1,
              transition: "width 0.6s ease",
              boxShadow: `0 0 6px currentColor`,
            }} />
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 7, letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.25)",
            marginTop: 4,
          }}>
            {usedPct}% USED · LIMIT {fmtMoney(wallet.credit_limit)}
          </div>
        </div>
      )}

      {/* Edit indicator */}
      <div style={{
        position: "absolute", top: 12, right: 12,
        opacity: hovered ? 0.5 : 0,
        transition: "opacity 0.15s",
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontSize: 8, color: "rgba(255,255,255,0.6)",
        letterSpacing: "0.1em",
      }}>EDIT</div>
    </div>
  );
}

// ── Stat "XP card" ────────────────────────────────────────────────────────────

function StatXPCard({ label, value, sub, accentColor, xpBar, xpPct }: {
  label: string; value: string; sub?: string;
  accentColor: string; xpBar?: boolean; xpPct?: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(12,10,3,0.8)",
        border: `1px solid ${hovered ? accentColor + "33" : "rgba(245,158,11,0.1)"}`,
        borderRadius: 8, padding: "14px 16px",
        position: "relative", overflow: "hidden",
        transition: "all 0.2s",
        boxShadow: hovered ? `0 0 16px ${accentColor}14` : "none",
      }}
    >
      {/* Glow bleed top-left */}
      <div style={{
        position: "absolute", top: -20, left: -20, width: 60, height: 60,
        borderRadius: "50%",
        background: accentColor + "18",
        pointerEvents: "none",
        filter: "blur(20px)",
      }} />

      <div style={{
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontSize: 7, letterSpacing: "0.22em", fontWeight: 700,
        color: accentColor, opacity: 0.7,
        marginBottom: 8,
      }}>{label}</div>

      <div style={{
        fontFamily: "'Syne','JetBrains Mono',monospace",
        fontSize: 20, fontWeight: 800,
        color: "#fff",
        letterSpacing: "-0.02em", lineHeight: 1,
      }}>{value}</div>

      {sub && (
        <div style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 8, letterSpacing: "0.06em",
          color: "rgba(255,255,255,0.25)",
          marginTop: 4,
        }}>{sub}</div>
      )}

      {xpBar && xpPct !== undefined && (
        <div style={{ marginTop: 10 }}>
          <div style={{
            width: "100%", height: 2,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 1, overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${Math.min(Math.max(xpPct, 0), 100)}%`,
              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
              borderRadius: 1,
              boxShadow: `0 0 8px ${accentColor}66`,
              transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Budget XP row ─────────────────────────────────────────────────────────────

function BudgetXPRow({ budget, onEdit }: { budget: BudgetWithSpent; onEdit: (b: BudgetWithSpent) => void }) {
  const [hovered, setHovered] = useState(false);
  const pct = Math.min((budget.spent / budget.amount) * 100, 100);
  const danger = pct >= 90;
  const warn = pct >= 70;
  const barColor = danger ? "#ef4444" : warn ? "#f59e0b" : budget.color;

  return (
    <button
      type="button"
      onClick={() => onEdit(budget)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", textAlign: "left",
        background: hovered ? "rgba(245,158,11,0.04)" : "transparent",
        border: "none", borderRadius: 4, padding: "6px 4px",
        cursor: "pointer", transition: "background 0.15s",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 5,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: budget.color,
            boxShadow: `0 0 6px ${budget.color}`,
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 9, letterSpacing: "0.08em",
            color: hovered ? "#fff" : "rgba(255,255,255,0.6)",
            transition: "color 0.15s",
          }}>{budget.name}</span>
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 8, letterSpacing: "0.04em",
          color: danger ? "#ef4444" : "rgba(255,255,255,0.3)",
        }}>
          {fmtMoney(budget.spent)} / {fmtMoney(budget.amount)}
        </div>
      </div>

      {/* XP-style progress bar */}
      <div style={{
        width: "100%", height: 3,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 2, overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
          borderRadius: 2,
          boxShadow: `0 0 8px ${barColor}55`,
          transition: "width 0.6s ease",
          position: "relative",
        }}>
          {/* Shine sweep */}
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: 20,
            background: `linear-gradient(90deg, transparent, ${barColor}44)`,
          }} />
        </div>
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between",
        marginTop: 3,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 7, letterSpacing: "0.1em",
          color: danger ? "rgba(239,68,68,0.6)" : warn ? "rgba(245,158,11,0.5)" : "rgba(255,255,255,0.18)",
        }}>
          {danger ? "⚠ LIMIT NEAR" : warn ? "↑ WATCH SPEND" : "◈ ON TRACK"}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 7, letterSpacing: "0.06em",
          color: "rgba(255,255,255,0.2)",
        }}>{Math.round(pct)}%</span>
      </div>
    </button>
  );
}

// ── Recurring row ─────────────────────────────────────────────────────────────

function RecurringRow({
  item, onEdit, walletMap, assetMap,
}: {
  item: RecurringTransactionItem;
  onEdit: (r: RecurringTransactionItem) => void;
  walletMap: Map<number, string>;
  assetMap: Map<number, string>;
}) {
  const [hovered, setHovered] = useState(false);
  const isIncome = item.type === "income";
  const isTransfer = item.type === "transfer";
  const isExpense = item.type === "expense";

  function getLabel() {
    if (item.description) return item.description;
    if (isTransfer) {
      const from = item.wallet_id ? walletMap.get(item.wallet_id)
        : item.from_asset_id ? assetMap.get(item.from_asset_id)
        : null;
      const to = item.to_wallet_id ? walletMap.get(item.to_wallet_id)
        : item.asset_id ? assetMap.get(item.asset_id)
        : null;
      if (from && to) return `TRANSFER · ${from} → ${to}`;
    }
    return item.name;
  }

  const amountColor = isIncome ? "#22c55e" : isExpense ? "#ef4444" : "rgba(255,255,255,0.7)";
  const dotColor = isIncome ? "#22c55e" : isExpense ? "#ef4444" : "#6366f1";
  const dotGlow = isIncome ? "0 0 6px #22c55e" : isExpense ? "0 0 6px #ef4444" : "0 0 6px #6366f1";

  return (
    <div
      onClick={() => onEdit(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 4px",
        background: hovered ? "rgba(245,158,11,0.04)" : "transparent",
        borderRadius: 4, cursor: "pointer", transition: "background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 5, height: 5, borderRadius: "50%",
          background: dotColor,
          boxShadow: dotGlow,
          flexShrink: 0,
        }} />
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 9, letterSpacing: "0.06em",
            color: hovered ? "#fff" : "rgba(255,255,255,0.65)",
            transition: "color 0.15s",
          }}>{getLabel()}</div>
          <div style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 7, letterSpacing: "0.1em",
            color: "rgba(245,158,11,0.35)",
            marginTop: 1,
          }}>
            {item.period.toUpperCase()} · NEXT {fmtDate(item.next_date)}
          </div>
        </div>
      </div>

      <span style={{
        fontFamily: "'Syne','JetBrains Mono',monospace",
        fontSize: 13, fontWeight: 700,
        color: amountColor,
        letterSpacing: "-0.01em",
      }}>
        {isIncome ? "+" : "−"}{fmtMoney(item.amount)}
      </span>
    </div>
  );
}

// ── Section shell ─────────────────────────────────────────────────────────────

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(10,8,2,0.8)",
      border: "1px solid rgba(245,158,11,0.1)",
      borderRadius: 8,
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px",
        borderBottom: "1px solid rgba(245,158,11,0.07)",
        background: "rgba(245,158,11,0.03)",
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 8, letterSpacing: "0.22em", fontWeight: 700,
          color: "rgba(245,158,11,0.6)",
        }}>{title}</span>
        {action}
      </div>
      <div style={{ padding: "12px 14px" }}>
        {children}
      </div>
    </div>
  );
}

// ── Add ghost button ──────────────────────────────────────────────────────────

function GhostAddButton({ label, onClick }: { label: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", padding: "8px",
        background: "transparent",
        border: `1px dashed ${hovered ? "rgba(245,158,11,0.4)" : "rgba(245,158,11,0.15)"}`,
        borderRadius: 4, cursor: "pointer",
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontSize: 8, letterSpacing: "0.16em",
        color: hovered ? "rgba(245,158,11,0.7)" : "rgba(245,158,11,0.3)",
        transition: "all 0.15s", marginTop: 8,
      }}
    >{label}</button>
  );
}

// ── Period toggle ─────────────────────────────────────────────────────────────

function PeriodToggle({ value, onChange }: { value: BudgetPeriodEnum; onChange: (p: BudgetPeriodEnum) => void }) {
  const opts = [
    { label: "W", value: BudgetPeriodEnum.Weekly },
    { label: "M", value: BudgetPeriodEnum.Monthly },
    { label: "Q", value: BudgetPeriodEnum.Quarterly },
    { label: "Y", value: BudgetPeriodEnum.Yearly },
  ];
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {opts.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: "2px 6px", borderRadius: 3,
            border: "1px solid",
            borderColor: o.value === value ? "#f59e0b" : "rgba(245,158,11,0.15)",
            background: o.value === value ? "rgba(245,158,11,0.15)" : "transparent",
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 8, letterSpacing: "0.1em",
            color: o.value === value ? "#f59e0b" : "rgba(245,158,11,0.3)",
            cursor: "pointer", transition: "all 0.12s",
          }}
        >{o.label}</button>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props { data: GetExpenseSummaryResponse | null; }

export default function DashboardTab({ data }: Props) {
  const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriodEnum>(BudgetPeriodEnum.Monthly);
  const [showAddWallet, setShowAddWallet]     = useState(false);
  const [editingWallet, setEditingWallet]     = useState<WalletWithBalance | null>(null);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransactionItem | null>(null);
  const [showAddBudget, setShowAddBudget]     = useState(false);
  const [editingBudget, setEditingBudget]     = useState<BudgetWithSpent | null>(null);

  const { data: walletsData }      = useGetWallets();
  const { data: budgetsData }      = useGetBudgets(budgetPeriod, periodStartDate[budgetPeriod]());
  const { data: debtsData }        = useGetDebts();
  const { data: recurringData }    = useGetRecurringTransactions();
  const { data: investmentsData }  = useGetInvestments();

  const wallets   = walletsData?.wallets   ?? [];
  const budgets   = budgetsData?.budgets   ?? [];
  const lent      = debtsData?.lent        ?? [];
  const borrowed  = debtsData?.borrowed    ?? [];
  const recurring = recurringData?.items   ?? [];

  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));
  const assetMap  = new Map(
    (investmentsData?.accounts ?? []).flatMap((a) => a.assets.map((ast) => [ast.id, ast.name] as [number, string]))
  );

  const monthSpent      = data?.grandTotal ?? 0;
  const budgetTotal     = budgets.reduce((s, b) => s + b.amount, 0);
  const budgetSpent     = budgets.reduce((s, b) => s + b.spent, 0);
  const budgetRemaining = budgetTotal - budgetSpent;
  const budgetHealthPct = budgetTotal > 0 ? Math.min((budgetRemaining / budgetTotal) * 100, 100) : 0;
  const netLent = lent.reduce((s, l) => s + (l.amount - l.paid_amount), 0)
                - borrowed.reduce((s, o) => s + (o.amount - o.paid_amount), 0);
  const recurringTotal = recurring.reduce((s, r) => s + r.amount, 0);

  const vsPrevious = data?.vsPrevious;
  const spendTrend = vsPrevious != null
    ? `${vsPrevious >= 0 ? "↑" : "↓"} ${Math.abs(vsPrevious).toFixed(0)}% VS PREV`
    : undefined;

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

        .dash-grid { display: grid; gap: 12px; }
        .dash-wallets { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
        .dash-stats   { grid-template-columns: repeat(4, 1fr); }
        .dash-bottom  { grid-template-columns: 1fr 1fr; }
        @media (max-width: 900px) {
          .dash-stats { grid-template-columns: 1fr 1fr; }
          .dash-bottom { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── Hero net balance strip ── */}
        <div style={{
          background: "rgba(10,8,2,0.8)",
          border: "1px solid rgba(245,158,11,0.15)",
          borderRadius: 8, padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -30, left: -30, width: 120, height: 120,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: 8, letterSpacing: "0.25em", fontWeight: 700,
              color: "rgba(245,158,11,0.5)",
              marginBottom: 4,
            }}>NET BALANCE · ALL WALLETS</div>
            <div style={{
              fontFamily: "'Syne',monospace",
              fontSize: 32, fontWeight: 800,
              color: totalBalance >= 0 ? "#fff" : "#ef4444",
              letterSpacing: "-0.03em", lineHeight: 1,
              textShadow: totalBalance >= 0 ? "0 0 30px rgba(245,158,11,0.15)" : "0 0 30px rgba(239,68,68,0.2)",
            }}>
              {totalBalance >= 0 ? "" : "−"}{fmtMoney(totalBalance)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 7, letterSpacing: "0.18em",
                color: "rgba(245,158,11,0.4)", marginBottom: 2,
              }}>THIS PERIOD</div>
              <div style={{
                fontFamily: "'Syne',monospace",
                fontSize: 16, fontWeight: 700,
                color: "#ef4444", letterSpacing: "-0.01em",
              }}>−{fmtMoney(monthSpent)}</div>
              {spendTrend && (
                <div style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: 7, letterSpacing: "0.1em",
                  color: vsPrevious! >= 0 ? "rgba(239,68,68,0.5)" : "rgba(34,197,94,0.5)",
                  marginTop: 2,
                }}>{spendTrend}</div>
              )}
            </div>
            <div style={{ width: 1, height: 40, background: "rgba(245,158,11,0.1)" }} />
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 7, letterSpacing: "0.18em",
                color: "rgba(245,158,11,0.4)", marginBottom: 2,
              }}>WALLETS</div>
              <div style={{
                fontFamily: "'Syne',monospace",
                fontSize: 16, fontWeight: 700, color: "#fff",
              }}>{wallets.length}</div>
            </div>
          </div>
        </div>

        {/* ── Wallet cards ── */}
        <div className="dash-grid dash-wallets">
          {wallets.map(w => (
            <WalletCard key={w.id} wallet={w} onEdit={setEditingWallet} />
          ))}
          <div
            onClick={() => setShowAddWallet(true)}
            style={{
              background: "rgba(10,8,2,0.5)",
              border: "1px dashed rgba(245,158,11,0.15)",
              borderRadius: 8, padding: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.15s", minHeight: 100,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,158,11,0.35)";
              (e.currentTarget as HTMLDivElement).style.background = "rgba(245,158,11,0.04)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,158,11,0.15)";
              (e.currentTarget as HTMLDivElement).style.background = "rgba(10,8,2,0.5)";
            }}
          >
            <span style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: 8, letterSpacing: "0.2em",
              color: "rgba(245,158,11,0.3)",
            }}>+ NEW WALLET</span>
          </div>
        </div>

        {/* ── Stat XP cards ── */}
        <div className="dash-grid dash-stats">
          <StatXPCard
            label="MONTH SPENT"
            value={fmtMoney(monthSpent)}
            sub={spendTrend}
            accentColor="#ef4444"
          />
          <StatXPCard
            label="BUDGET SHIELD"
            value={fmtMoney(budgetRemaining)}
            sub={budgetTotal > 0 ? `OF ${fmtMoney(budgetTotal)} TOTAL` : undefined}
            accentColor="#22c55e"
            xpBar xpPct={budgetHealthPct}
          />
          <StatXPCard
            label="NET LENT"
            value={`${netLent >= 0 ? "+" : "−"}${fmtMoney(netLent)}`}
            sub="AWAITING REPAYMENT"
            accentColor="#3b82f6"
          />
          <StatXPCard
            label="RECURRING / MO"
            value={fmtMoney(recurringTotal)}
            sub={recurring.length > 0 ? `${recurring.length} ACTIVE STREAMS` : undefined}
            accentColor="#a855f7"
          />
        </div>

        {/* ── Budgets + Recurring ── */}
        <div className="dash-grid dash-bottom">
          {/* Budgets */}
          <Section
            title="BUDGET QUESTS"
            action={<PeriodToggle value={budgetPeriod} onChange={setBudgetPeriod} />}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {budgets.length === 0 ? (
                <div style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: 9, letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.2)", padding: "8px 4px",
                }}>NO BUDGETS CONFIGURED</div>
              ) : (
                budgets.map(b => (
                  <BudgetXPRow key={b.id} budget={b} onEdit={setEditingBudget} />
                ))
              )}
            </div>
            <GhostAddButton label="+ DEFINE BUDGET" onClick={() => setShowAddBudget(true)} />
          </Section>

          {/* Recurring */}
          <Section
            title="INCOME / EXPENSE STREAMS"
            action={
              <button
                onClick={() => { setEditingRecurring(null); setShowAddRecurring(true); }}
                style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: 7, letterSpacing: "0.15em",
                  color: "rgba(245,158,11,0.5)", background: "transparent",
                  border: "1px solid rgba(245,158,11,0.2)", borderRadius: 3,
                  padding: "3px 7px", cursor: "pointer", transition: "all 0.12s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f59e0b"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,158,11,0.4)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,158,11,0.5)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,158,11,0.2)"; }}
              >+ ADD</button>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {recurring.length === 0 ? (
                <div style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: 9, letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.2)", padding: "8px 4px",
                }}>NO RECURRING STREAMS</div>
              ) : (
                recurring.map(r => (
                  <RecurringRow
                    key={r.id} item={r}
                    walletMap={walletMap} assetMap={assetMap}
                    onEdit={item => { setEditingRecurring(item); setShowAddRecurring(true); }}
                  />
                ))
              )}
            </div>
          </Section>
        </div>
      </div>

      {/* Modals */}
      {showAddWallet   && <AddWalletModal onClose={() => setShowAddWallet(false)} />}
      {editingWallet   && <EditWalletModal wallet={editingWallet} onClose={() => setEditingWallet(null)} />}
      {showAddRecurring && (
        <AddRecurringTransactionModal
          wallets={wallets}
          editing={editingRecurring ?? undefined}
          onClose={() => { setShowAddRecurring(false); setEditingRecurring(null); }}
        />
      )}
      {showAddBudget   && <AddBudgetModal onClose={() => setShowAddBudget(false)} />}
      {editingBudget   && <EditBudgetModal budget={editingBudget} onClose={() => setEditingBudget(null)} />}
    </>
  );
}

import { useState } from "react";
import type {
  GetTransactionsResponse,
  MoneyCategoryItem,
  UnifiedTransaction,
  WalletWithBalance,
} from "@/schemas";
import EditEntryModal from "./EditEntryModal";

interface Props {
  data: GetTransactionsResponse | null;
  wallets: WalletWithBalance[];
  from: string;
  to: string;
}

type FilterCategory = MoneyCategoryItem | "transfer" | null;

const TYPE_LABEL: Record<string, string> = {
  transfer: "TRANSFER",
  income: "INCOME",
  expense: "EXPENSE",
  lent: "LENT",
  borrowed: "BORROWED",
  lent_repayment: "REPAID",
  borrowed_repayment: "REPAID",
};

function getLabel(item: UnifiedTransaction): string {
  if (item.type === "expense")
    return (item.category?.display_label ?? "EXPENSE").toUpperCase();
  return TYPE_LABEL[item.type] ?? item.type.toUpperCase();
}

function getDotColor(item: UnifiedTransaction): string {
  if (item.type === "expense" && item.category) return item.category.color;
  if (item.type === "income") return "#22c55e";
  if (item.type === "lent") return "#f59e0b";
  if (item.type === "lent_repayment") return "#22c55e";
  if (item.type === "borrowed") return "#3b82f6";
  if (item.type === "borrowed_repayment") return "#ef4444";
  return "#6366f1";
}

function getWalletLabel(item: UnifiedTransaction): string {
  if (item.type === "transfer")
    return `${item.from_wallet_name ?? "?"} → ${item.to_wallet_name ?? "?"}`;
  return item.wallet_name ?? "";
}

function getAmountColor(item: UnifiedTransaction): string {
  if (item.type === "income" || item.type === "lent_repayment")
    return "#22c55e";
  if (item.type === "transfer") return "#6366f1";
  return "rgba(255,255,255,0.85)";
}

function getAmountPrefix(item: UnifiedTransaction): string {
  if (item.type === "income" || item.type === "lent_repayment") return "+";
  if (item.type === "transfer") return "";
  return "−";
}

function matchesFilter(
  item: UnifiedTransaction,
  filter: FilterCategory,
): boolean {
  if (filter === null) return true;
  if (filter === "transfer") return item.type === "transfer";
  return item.category?.id === (filter as MoneyCategoryItem).id;
}

function fmtAmount(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

function fmtDayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
}

// ── Filter chip ────────────────────────────────────────────────────────────────

function FilterChip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 3,
        border: "1px solid",
        borderColor: active
          ? "#f59e0b"
          : hovered
            ? "rgba(245,158,11,0.3)"
            : "rgba(245,158,11,0.12)",
        background: active
          ? "rgba(245,158,11,0.15)"
          : hovered
            ? "rgba(245,158,11,0.05)"
            : "transparent",
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontSize: 8,
        letterSpacing: "0.16em",
        fontWeight: 700,
        color: active
          ? "#f59e0b"
          : hovered
            ? "rgba(245,158,11,0.6)"
            : "rgba(255,255,255,0.3)",
        cursor: "pointer",
        transition: "all 0.12s",
        whiteSpace: "nowrap",
      }}
    >
      {color && (
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: active ? color : "rgba(255,255,255,0.2)",
            flexShrink: 0,
            boxShadow: active ? `0 0 4px ${color}` : "none",
            transition: "all 0.12s",
          }}
        />
      )}
      {label.toUpperCase()}
    </button>
  );
}

// ── Day header ─────────────────────────────────────────────────────────────────

function DayHeader({
  dateStr,
  dailyNet,
}: {
  dateStr: string;
  dailyNet: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        padding: "6px 14px",
        background: "rgba(245,158,11,0.04)",
        borderBottom: "1px solid rgba(245,158,11,0.08)",
        borderTop: "1px solid rgba(245,158,11,0.06)",
      }}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 8,
          letterSpacing: "0.2em",
          fontWeight: 700,
          color: "rgba(245,158,11,0.5)",
        }}
      >
        {fmtDayDate(dateStr)}
      </span>
      {dailyNet !== 0 && (
        <span
          style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 8,
            letterSpacing: "0.12em",
            color: dailyNet > 0 ? "rgba(239,68,68,0.5)" : "rgba(34,197,94,0.4)",
          }}
        >
          {dailyNet > 0 ? "−" : "+"}
          {fmtAmount(Math.abs(dailyNet))}
        </span>
      )}
    </div>
  );
}

// ── Transaction row ────────────────────────────────────────────────────────────

function TxRow({
  item,
  isLast,
  onEdit,
}: {
  item: UnifiedTransaction;
  isLast: boolean;
  onEdit: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const dotColor = getDotColor(item);
  const label = getLabel(item);
  const walletLabel = getWalletLabel(item);
  const amountColor = getAmountColor(item);
  const prefix = getAmountPrefix(item);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "10px 1fr auto auto auto",
        alignItems: "center",
        gap: "0 10px",
        padding: "7px 14px",
        background: hovered ? "rgba(245,158,11,0.03)" : "transparent",
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.03)",
        transition: "background 0.12s",
        cursor: "default",
      }}
    >
      {/* dot */}
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: dotColor,
          boxShadow: hovered ? `0 0 6px ${dotColor}` : "none",
          transition: "box-shadow 0.15s",
          justifySelf: "center",
          flexShrink: 0,
        }}
      />

      {/* description */}
      <div
        style={{
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 10,
            letterSpacing: "0.04em",
            color: hovered ? "#fff" : "rgba(255,255,255,0.75)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            transition: "color 0.12s",
          }}
        >
          {item.description ?? "—"}
        </div>
      </div>

      {/* category · wallet — right-aligned metadata */}
      <div
        style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 7,
          letterSpacing: "0.1em",
          color: "rgba(245,158,11,0.35)",
          whiteSpace: "nowrap",
          textAlign: "right",
        }}
      >
        {label}
        {walletLabel ? ` · ${walletLabel}` : ""}
      </div>

      {/* amount */}
      <div
        style={{
          fontFamily: "'Syne','JetBrains Mono',monospace",
          fontSize: 12,
          fontWeight: 700,
          color: amountColor,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          textAlign: "right",
          minWidth: 70,
        }}
      >
        {prefix}
        {fmtAmount(item.amount)}
      </div>

      {/* edit */}
      <button
        onClick={onEdit}
        style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 7,
          letterSpacing: "0.14em",
          color: hovered ? "rgba(245,158,11,0.55)" : "rgba(255,255,255,0.12)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "2px 4px",
          transition: "color 0.12s",
          whiteSpace: "nowrap",
        }}
      >
        EDIT
      </button>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function TransactionsTab({ data, wallets, from, to }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>(null);
  const [editingEntry, setEditingEntry] = useState<UnifiedTransaction | null>(
    null,
  );

  const days = data
    ? data.byDay
        .map((day) => ({
          ...day,
          items: day.items.filter((item) => matchesFilter(item, activeFilter)),
        }))
        .filter((day) => day.items.length > 0)
    : [];

  const presentCategories: MoneyCategoryItem[] = data
    ? (() => {
        const seen = new Map<number, MoneyCategoryItem>();
        for (const day of data.byDay)
          for (const item of day.items)
            if (item.category && !seen.has(item.category.id))
              seen.set(item.category.id, item.category);
        return Array.from(seen.values());
      })()
    : [];

  const hasTransfers = data
    ? data.byDay.some((day) =>
        day.items.some((item) => item.type === "transfer"),
      )
    : false;

  const activeFilterId =
    activeFilter === null
      ? null
      : activeFilter === "transfer"
        ? "transfer"
        : (activeFilter as MoneyCategoryItem).id;

  const totalExpenses = data
    ? data.byDay
        .flatMap((d) => d.items)
        .filter((i) => i.type === "expense")
        .reduce((s, i) => s + i.amount, 0)
    : 0;
  const totalIncome = data
    ? data.byDay
        .flatMap((d) => d.items)
        .filter((i) => i.type === "income")
        .reduce((s, i) => s + i.amount, 0)
    : 0;
  const txCount = data ? data.byDay.flatMap((d) => d.items).length : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
      `}</style>

      {/* ── Period summary strip — full width ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 1,
          background: "rgba(245,158,11,0.06)",
          border: "1px solid rgba(245,158,11,0.1)",
          borderRadius: 6,
          overflow: "hidden",
          marginBottom: 8,
        }}
      >
        {[
          {
            label: "PERIOD IN",
            value: fmtAmount(totalIncome),
            color: "#22c55e",
          },
          {
            label: "PERIOD OUT",
            value: fmtAmount(totalExpenses),
            color: "#ef4444",
          },
          {
            label: "ENTRIES",
            value: String(txCount),
            color: "rgba(245,158,11,0.7)",
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              padding: "8px 14px",
              background: "rgba(8,6,2,0.6)",
              borderRight: i < 2 ? "1px solid rgba(245,158,11,0.08)" : "none",
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 7,
                letterSpacing: "0.2em",
                color: "rgba(245,158,11,0.4)",
                marginBottom: 2,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: "'Syne',monospace",
                fontSize: 16,
                fontWeight: 800,
                color: s.color,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter chips — full width ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <FilterChip
          label="ALL"
          active={activeFilter === null}
          onClick={() => setActiveFilter(null)}
        />
        {presentCategories.map((cat) => (
          <FilterChip
            key={cat.id}
            label={cat.display_label}
            color={cat.color}
            active={activeFilterId === cat.id}
            onClick={() =>
              setActiveFilter(activeFilterId === cat.id ? null : cat)
            }
          />
        ))}
        {hasTransfers && (
          <FilterChip
            label="TRANSFER"
            color="#6366f1"
            active={activeFilterId === "transfer"}
            onClick={() =>
              setActiveFilter(activeFilterId === "transfer" ? null : "transfer")
            }
          />
        )}
      </div>

      {/* ── Ledger table — 600px centered ── */}
      <div style={{ maxWidth: 600, margin: "0 auto", width: "100%" }}>
        <div
          style={{
            background: "rgba(10,8,2,0.8)",
            border: "1px solid rgba(245,158,11,0.1)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {/* Column header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "10px 1fr auto auto auto",
              gap: "0 10px",
              padding: "5px 14px",
              borderBottom: "1px solid rgba(245,158,11,0.08)",
              background: "rgba(245,158,11,0.02)",
            }}
          >
            {["", "DESCRIPTION", "CATEGORY · WALLET", "AMOUNT", ""].map(
              (h, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    fontSize: 7,
                    letterSpacing: "0.18em",
                    fontWeight: 700,
                    color: "rgba(245,158,11,0.3)",
                    textAlign: i >= 2 ? "right" : "left",
                  }}
                >
                  {h}
                </div>
              ),
            )}
          </div>

          {!data || days.length === 0 ? (
            <div
              style={{
                padding: "40px 0",
                textAlign: "center",
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 9,
                letterSpacing: "0.2em",
                color: "rgba(245,158,11,0.2)",
              }}
            >
              NO ENTRIES FOR THIS PERIOD
            </div>
          ) : (
            days.map((day) => {
              const dailyExpenses = day.items
                .filter((i) => i.type === "expense")
                .reduce((s, i) => s + i.amount, 0);
              return (
                <div key={day.date}>
                  <DayHeader dateStr={day.date} dailyNet={dailyExpenses} />
                  {day.items.map((item, idx) => (
                    <TxRow
                      key={`${item.type}-${item.id}`}
                      item={item}
                      isLast={idx === day.items.length - 1}
                      onEdit={() => setEditingEntry(item)}
                    />
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          wallets={wallets}
          from={from}
          to={to}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </>
  );
}

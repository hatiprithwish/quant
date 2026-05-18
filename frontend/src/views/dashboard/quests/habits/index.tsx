import { useState } from "react";
import { useGetHabits } from "@/api/cachedQueries";
import type { HabitData } from "@/api/cachedQueries";
import Spinner from "@/components/common/Spinner";

const MONO = "'JetBrains Mono','Fira Code','Courier New',monospace";

function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  now.setDate(now.getDate() + diff);
  return now.toISOString().slice(0, 10);
}

function getSundayOf(monday: string): string {
  const [y, m, d] = monday.split("-").map(Number);
  const date = new Date(y, m - 1, d + 6);
  return date.toISOString().slice(0, 10);
}

function addWeeks(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + n * 7);
  return date.toISOString().slice(0, 10);
}

function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const CATEGORY_COLOR: Record<string, { color: string; rgb: string }> = {
  time: { color: "#a78bfa", rgb: "167,139,250" },
  food: { color: "#f97316", rgb: "249,115,22" },
  money: { color: "#22c55e", rgb: "34,197,94" },
  investment: { color: "#06b6d4", rgb: "6,182,212" },
  manual: { color: "#eab308", rgb: "234,179,8" },
};

const TREND_ICON: Record<string, string> = { good: "↑", bad: "↓", neutral: "→" };
const TREND_COLOR: Record<string, string> = { good: "#22c55e", bad: "#ef4444", neutral: "#eab308" };

function HabitCard({ habit }: { habit: HabitData }) {
  const [open, setOpen] = useState(false);
  const cat = CATEGORY_COLOR[habit.category] ?? CATEGORY_COLOR.manual;
  const pct = habit.total_days > 0 ? Math.round((habit.occurred_days / habit.total_days) * 100) : 0;
  const barColor = habit.is_distraction
    ? pct > 30 ? "#ef4444" : "#22c55e"
    : pct >= 60 ? "#22c55e" : pct >= 30 ? "#eab308" : "#ef4444";

  return (
    <div
      style={{ background: "rgba(14,9,26,0.9)", border: `1px solid rgba(${cat.rgb},0.14)`, borderRadius: 8, overflow: "hidden", transition: "border-color 0.2s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${cat.rgb},0.3)`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${cat.rgb},0.14)`; }}
    >
      {/* Header row */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", userSelect: "none" }}
        onClick={() => setOpen((o) => !o)}
      >
        {/* Distraction indicator */}
        {habit.is_distraction ? (
          <span style={{ fontSize: 8, color: "#ef4444", flexShrink: 0 }}>×</span>
        ) : (
          <span style={{ fontSize: 8, color: cat.color, flexShrink: 0 }}>◆</span>
        )}

        {/* Label */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: "#e2d9f3", letterSpacing: "0.03em" }}>{habit.label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <span style={{ fontFamily: MONO, fontSize: 7, color: `rgba(${cat.rgb},0.55)`, background: `rgba(${cat.rgb},0.08)`, border: `1px solid rgba(${cat.rgb},0.18)`, padding: "1px 5px", borderRadius: 2, letterSpacing: "0.08em" }}>
              {habit.category.toUpperCase()}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 7, color: "#06b6d4", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.18)", padding: "1px 5px", borderRadius: 2, letterSpacing: "0.08em" }}>
              {habit.badge}
            </span>
          </div>
        </div>

        {/* Occurrence bar + stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 60 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.3)" }}>{habit.occurred_days}/{habit.total_days}d</span>
              <span style={{ fontFamily: MONO, fontSize: 7, fontWeight: 700, color: barColor }}>{pct}%</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 2, boxShadow: `0 0 4px ${barColor}60` }} />
            </div>
          </div>
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: TREND_COLOR[habit.trend] }}>{TREND_ICON[habit.trend]}</span>
        </div>

        <span style={{ fontSize: 8, color: `rgba(${cat.rgb},0.5)`, transform: open ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block", transition: "transform 0.2s", flexShrink: 0 }}>›</span>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: "0 14px 12px", borderTop: `1px solid rgba(${cat.rgb},0.08)`, paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Metric values */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {habit.hours !== undefined && (
              <div>
                <div style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 2 }}>HOURS</div>
                <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: cat.color }}>{habit.hours.toFixed(1)}</div>
              </div>
            )}
            {habit.amount !== undefined && (
              <div>
                <div style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 2 }}>AMOUNT</div>
                <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: cat.color }}>₹{habit.amount.toLocaleString("en-IN")}</div>
              </div>
            )}
            {habit.count !== undefined && (
              <div>
                <div style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 2 }}>COUNT</div>
                <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: cat.color }}>{habit.count}</div>
              </div>
            )}
            <div>
              <div style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 2 }}>DAYS ACTIVE</div>
              <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: barColor }}>{habit.occurred_days} / {habit.total_days}</div>
            </div>
          </div>

          {/* Evidence details */}
          <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, background: `rgba(${cat.rgb},0.03)`, border: `1px solid rgba(${cat.rgb},0.08)`, borderRadius: 4, padding: "8px 10px" }}>
            {habit.details}
          </div>

          {/* Trend badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: MONO, fontSize: 7, color: TREND_COLOR[habit.trend], background: `${TREND_COLOR[habit.trend]}15`, border: `1px solid ${TREND_COLOR[habit.trend]}30`, padding: "2px 8px", borderRadius: 2, letterSpacing: "0.1em" }}>
              {TREND_ICON[habit.trend]} {habit.trend.toUpperCase()}
            </span>
            {habit.is_distraction && (
              <span style={{ fontFamily: MONO, fontSize: 7, color: "#ef4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", padding: "2px 8px", borderRadius: 2, letterSpacing: "0.1em" }}>
                DISTRACTION
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryBar({ habits }: { habits: HabitData[] }) {
  const distractions = habits.filter((h) => h.is_distraction);
  const growthHabits = habits.filter((h) => !h.is_distraction);
  const goodDistractions = distractions.filter((h) => h.trend === "good").length;
  const goodGrowth = growthHabits.filter((h) => h.trend === "good").length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10, padding: "12px 0", borderBottom: "1px solid rgba(139,92,246,0.1)", marginBottom: 14 }}>
      {[
        { label: "HABITS TRACKED", value: habits.length, color: "#a78bfa" },
        { label: "DISTRACTIONS", value: distractions.length, color: "#ef4444" },
        { label: "ELIM SUCCESS", value: `${goodDistractions}/${distractions.length}`, color: "#22c55e" },
        { label: "GROWTH HABITS", value: goodGrowth, color: "#06b6d4" },
      ].map((s) => (
        <div key={s.label} style={{ textAlign: "center", padding: "8px 12px", background: "rgba(14,9,26,0.8)", border: "1px solid rgba(139,92,246,0.1)", borderRadius: 6 }}>
          <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          <div style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginTop: 3 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function HabitIntelligencePage() {
  const thisMonday = getMondayOfCurrentWeek();
  const [weekStart, setWeekStart] = useState(thisMonday);
  const weekEnd = getSundayOf(weekStart);
  const [filter, setFilter] = useState<"all" | "distraction" | "growth">("all");

  const { data, isLoading } = useGetHabits(weekStart, weekEnd);
  const habits = data?.habits ?? [];

  const filtered = habits.filter((h) => {
    if (filter === "distraction") return h.is_distraction;
    if (filter === "growth") return !h.is_distraction;
    return true;
  });

  const canGoForward = weekStart < thisMonday;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        .habits-shell { display: flex; flex: 1; height: 100%; min-height: 0; background: #07050f; position: relative; overflow: hidden; flex-direction: column; }
        .habits-shell::before { content: ''; position: absolute; inset: 0; background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.007) 2px, rgba(139,92,246,0.007) 4px); pointer-events: none; z-index: 0; }
        .habits-shell::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 80% 30%, rgba(6,182,212,0.06) 0%, transparent 55%), radial-gradient(ellipse at 10% 70%, rgba(109,40,217,0.1) 0%, transparent 50%); pointer-events: none; z-index: 0; }
        .habits-scroll { flex: 1; overflow-y: auto; padding: 20px 24px; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 10px; }
        .habits-scroll::-webkit-scrollbar { width: 4px; }
        .habits-scroll::-webkit-scrollbar-track { background: transparent; }
        .habits-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.2); border-radius: 2px; }
        @keyframes habIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .hab-animate { animation: habIn 0.25s ease-out forwards; }
      `}</style>

      <div className="habits-shell">
        {/* Header */}
        <div style={{ position: "relative", zIndex: 1, borderBottom: "1px solid rgba(139,92,246,0.1)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(6,4,12,0.55)", backdropFilter: "blur(2px)", flexShrink: 0, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, color: "rgba(6,182,212,0.5)", textShadow: "0 0 10px rgba(6,182,212,0.3)" }}>◈</span>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.22em", fontWeight: 700, color: "#ffffff" }}>HABIT INTELLIGENCE</div>
              <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.12em", color: "rgba(6,182,212,0.4)", marginTop: 1 }}>auto-detected from time · food · money data</div>
            </div>
          </div>

          {/* Week navigator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setWeekStart(addWeeks(weekStart, -1))}
              style={{ fontFamily: MONO, fontSize: 10, padding: "4px 10px", borderRadius: 3, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa", cursor: "pointer" }}
            >
              ←
            </button>
            <div style={{ fontFamily: MONO, fontSize: 8, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em", textAlign: "center", minWidth: 110 }}>
              <div>{formatShortDate(weekStart)} – {formatShortDate(weekEnd)}</div>
              {weekStart === thisMonday && <div style={{ color: "rgba(139,92,246,0.5)", fontSize: 7, marginTop: 1 }}>CURRENT WEEK</div>}
            </div>
            <button
              onClick={() => canGoForward && setWeekStart(addWeeks(weekStart, 1))}
              disabled={!canGoForward}
              style={{ fontFamily: MONO, fontSize: 10, padding: "4px 10px", borderRadius: 3, background: canGoForward ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${canGoForward ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.06)"}`, color: canGoForward ? "#a78bfa" : "rgba(255,255,255,0.15)", cursor: canGoForward ? "pointer" : "not-allowed" }}
            >
              →
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ position: "relative", zIndex: 1, borderBottom: "1px solid rgba(139,92,246,0.08)", padding: "0 24px", display: "flex", gap: 0, background: "rgba(6,4,12,0.3)", flexShrink: 0 }}>
          {(["all", "growth", "distraction"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.1em", padding: "9px 14px", background: "transparent", border: "none", borderBottom: filter === f ? "2px solid #a78bfa" : "2px solid transparent", color: filter === f ? "#a78bfa" : "rgba(255,255,255,0.3)", cursor: "pointer", transition: "all 0.15s" }}
            >
              {f === "all" ? "ALL HABITS" : f === "growth" ? "↑ GROWTH" : "× DISTRACTIONS"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
            <Spinner />
          </div>
        ) : habits.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: MONO, fontSize: 28, color: "rgba(6,182,212,0.2)", marginBottom: 12 }}>◈</div>
              <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginBottom: 6 }}>NO HABIT DATA</div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.2)", lineHeight: 1.6 }}>
                Log time, food, and expenses during the week.<br />
                Habits are auto-detected at end of day.
              </div>
            </div>
          </div>
        ) : (
          <div className="habits-scroll hab-animate">
            <SummaryBar habits={habits} />
            {filtered.length === 0 ? (
              <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "24px 0" }}>
                No {filter} habits detected this week.
              </div>
            ) : (
              filtered.map((h) => <HabitCard key={h.key} habit={h} />)
            )}
          </div>
        )}
      </div>
    </>
  );
}

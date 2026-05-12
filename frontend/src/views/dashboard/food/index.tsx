import { useState, useMemo, useRef, useEffect } from "react";
import { useGetFood } from "@/api/cachedQueries";
import { MealTypeLabelEnum } from "@/schemas";
import type { DailyFoodSummary } from "@/schemas";
import NutritionHero from "./components/NutritionHero";
import MacroChart from "./components/MacroChart";
import MealLog from "./components/MealLog";
import Spinner from "@/components/common/Spinner";

const G = "'JetBrains Mono','Fira Code',monospace";
const A = "#10b981";

function today() { return new Date().toISOString().split("T")[0]; }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; }
function startOfMonth() { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; }
function startOfYear() { const d = new Date(); d.setMonth(0, 1); return d.toISOString().split("T")[0]; }
function fmtDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}`;
}

const PRESETS = [
  { label: "Today",  from: () => today(),       to: () => today() },
  { label: "7d",     from: () => daysAgo(6),    to: () => today() },
  { label: "Month",  from: () => startOfMonth(), to: () => today() },
  { label: "Year",   from: () => startOfYear(),  to: () => today() },
];

type MealFilter = MealTypeLabelEnum | null;

const RAIL_NAV: { label: string; sub: string; glyph: string; value: MealFilter }[] = [
  { label: "ALL MEALS",  sub: "full log",   glyph: "◈",  value: null },
  { label: "BREAKFAST",  sub: "morning",    glyph: "○",  value: MealTypeLabelEnum.Breakfast },
  { label: "LUNCH",      sub: "midday",     glyph: "◐",  value: MealTypeLabelEnum.Lunch },
  { label: "DINNER",     sub: "evening",    glyph: "●",  value: MealTypeLabelEnum.Dinner },
  { label: "SNACK",      sub: "in-between", glyph: "◦",  value: MealTypeLabelEnum.Snack },
];

const MEAL_COLORS: Record<MealTypeLabelEnum, string> = {
  [MealTypeLabelEnum.Breakfast]: "#f59e0b",
  [MealTypeLabelEnum.Lunch]:     "#10b981",
  [MealTypeLabelEnum.Dinner]:    "#818cf8",
  [MealTypeLabelEnum.Snack]:     "#ec4899",
};

// ── Date Range Dropdown ──────────────────────────────────────────────────────────

function DateRangeDropdown({ from, to, onChange }: { from: string; to: string; onChange: (f: string, t: string) => void }) {
  const [open, setOpen] = useState(false);
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setLocalFrom(from); }, [from]);
  useEffect(() => { setLocalTo(to); }, [to]);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const label = from === to ? fmtDate(from) : `${fmtDate(from)} – ${fmtDate(to)}`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 10px",
          background: `rgba(16,185,129,0.07)`,
          border: `1px solid rgba(16,185,129,0.22)`,
          borderRadius: 4,
          fontFamily: G, fontSize: 10, letterSpacing: "0.08em",
          color: A, cursor: "pointer", whiteSpace: "nowrap",
          transition: "border-color 0.15s, background 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(16,185,129,0.13)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(16,185,129,0.07)"; }}
      >
        <span style={{ opacity: 0.55 }}>◷</span>
        {label}
        <span style={{ opacity: 0.4, fontSize: 8 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50,
          background: "#05100a",
          border: "1px solid rgba(16,185,129,0.18)",
          borderRadius: 6, padding: 12, minWidth: "15rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(16,185,129,0.04)",
          fontFamily: G,
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
            {PRESETS.map(p => {
              const pFrom = p.from(); const pTo = p.to();
              const active = from === pFrom && to === pTo;
              return (
                <button
                  key={p.label}
                  onClick={() => { onChange(pFrom, pTo); setOpen(false); }}
                  style={{
                    padding: "3px 8px", borderRadius: 3, fontSize: 9, letterSpacing: "0.1em",
                    fontFamily: "inherit", cursor: "pointer", border: "1px solid",
                    background: active ? A : "transparent",
                    borderColor: active ? A : "rgba(16,185,129,0.2)",
                    color: active ? "#000" : "rgba(16,185,129,0.6)",
                    transition: "all 0.15s",
                  }}
                >{p.label}</button>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="date" value={localFrom} max={localTo}
              onChange={e => { setLocalFrom(e.target.value); if (e.target.value && localTo && e.target.value <= localTo) onChange(e.target.value, localTo); }}
              style={{ flex: 1, minWidth: 0, fontSize: 9, border: "1px solid rgba(16,185,129,0.2)", borderRadius: 3, padding: "4px 6px", background: "#061009", color: A, fontFamily: "inherit", outline: "none", colorScheme: "dark" } as React.CSSProperties}
            />
            <span style={{ color: "rgba(16,185,129,0.3)", fontSize: 10 }}>→</span>
            <input type="date" value={localTo} min={localFrom} max={today()}
              onChange={e => { setLocalTo(e.target.value); if (e.target.value && localFrom && localFrom <= e.target.value) onChange(localFrom, e.target.value); }}
              style={{ flex: 1, minWidth: 0, fontSize: 9, border: "1px solid rgba(16,185,129,0.2)", borderRadius: 3, padding: "4px 6px", background: "#061009", color: A, fontFamily: "inherit", outline: "none", colorScheme: "dark" } as React.CSSProperties}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Left Rail ──────────────────────────────────────────────────────────────────

function FuelRail({ filter, setFilter }: { filter: MealFilter; setFilter: (f: MealFilter) => void }) {
  return (
    <aside style={{
      width: 160, flexShrink: 0,
      background: "rgba(2,10,6,0.75)",
      borderRight: "1px solid rgba(16,185,129,0.1)",
      display: "flex", flexDirection: "column",
      padding: "16px 0", position: "relative",
      backdropFilter: "blur(4px)",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 20%, rgba(16,185,129,0.035) 0%, transparent 70%)",
      }} />

      <div style={{ padding: "0 12px 12px", borderBottom: "1px solid rgba(16,185,129,0.07)", marginBottom: 8 }}>
        <div style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.22em", color: "rgba(16,185,129,0.4)", marginBottom: 2 }}>
          SECTOR
        </div>
        <div style={{ fontFamily: G, fontSize: 11, letterSpacing: "0.18em", fontWeight: 700, color: A, textShadow: `0 0 12px rgba(16,185,129,0.5)` }}>
          FUEL
        </div>
      </div>

      <nav style={{ flex: 1, padding: "0 6px", display: "flex", flexDirection: "column", gap: 1 }}>
        {RAIL_NAV.map(item => {
          const active = filter === item.value;
          const accent = item.value ? MEAL_COLORS[item.value] : A;
          return (
            <button
              key={String(item.value)}
              onClick={() => setFilter(item.value)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start",
                padding: "8px 8px",
                background: active ? `rgba(16,185,129,0.07)` : "transparent",
                border: "none",
                borderLeftWidth: 2, borderLeftStyle: "solid",
                borderLeftColor: active ? accent : "transparent",
                borderRadius: "0 4px 4px 0",
                cursor: "pointer", textAlign: "left", width: "100%",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(16,185,129,0.04)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
                <span style={{
                  fontSize: 10,
                  color: active ? accent : "rgba(16,185,129,0.25)",
                  textShadow: active ? `0 0 8px ${accent}99` : "none",
                  flexShrink: 0, transition: "color 0.15s",
                }}>{item.glyph}</span>
                <span style={{
                  fontFamily: G, fontSize: 9, letterSpacing: "0.12em", fontWeight: 700,
                  color: active ? "#fff" : "rgba(255,255,255,0.3)",
                  transition: "color 0.15s", flex: 1,
                }}>{item.label}</span>
                {active && (
                  <div style={{
                    width: 3, height: 3, borderRadius: "50%",
                    background: accent, boxShadow: `0 0 6px ${accent}`,
                    flexShrink: 0,
                  }} />
                )}
              </div>
              <div style={{
                fontFamily: G, fontSize: 7, letterSpacing: "0.1em",
                color: active ? `${accent}88` : "rgba(255,255,255,0.17)",
                marginLeft: 16, marginTop: 1, transition: "color 0.15s",
              }}>{item.sub}</div>
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "10px 12px 0", borderTop: "1px solid rgba(16,185,129,0.07)", marginTop: 8 }}>
        <div style={{ fontFamily: G, fontSize: 7, letterSpacing: "0.1em", color: "rgba(16,185,129,0.2)", lineHeight: 1.6 }}>
          <div>SYS · FUEL</div>
          <div>STATUS · ONLINE</div>
        </div>
      </div>
    </aside>
  );
}

// ── Derived data ───────────────────────────────────────────────────────────────

function applyMealFilter(days: DailyFoodSummary[], filter: MealFilter): DailyFoodSummary[] {
  if (filter === null) return days;
  return days
    .map(day => ({
      ...day,
      meals: day.meals.filter(m => m.meal_type === filter),
      total_calories: day.meals.filter(m => m.meal_type === filter).reduce((s, m) => s + m.total_calories, 0),
      total_protein_g: day.meals.filter(m => m.meal_type === filter).reduce((s, m) => s + m.total_protein_g, 0),
      total_carb_g: day.meals.filter(m => m.meal_type === filter).reduce((s, m) => s + m.total_carb_g, 0),
      total_fat_g: day.meals.filter(m => m.meal_type === filter).reduce((s, m) => s + m.total_fat_g, 0),
    }))
    .filter(day => day.meals.length > 0);
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function FoodPage() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [filter, setFilter] = useState<MealFilter>(null);

  const { data, isLoading, error } = useGetFood(from, to);

  const filteredDays = useMemo(
    () => (data ? applyMealFilter(data.days, filter) : []),
    [data, filter],
  );

  const totals = useMemo(() => {
    let calories = 0, protein = 0, carbs = 0, fat = 0, meals = 0;
    filteredDays.forEach(day => {
      day.meals.forEach(m => {
        calories += m.total_calories;
        protein += m.total_protein_g;
        carbs += m.total_carb_g;
        fat += m.total_fat_g;
        meals += 1;
      });
    });
    return { calories, protein, carbs, fat, meals };
  }, [filteredDays]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

        .fuel-shell {
          display: flex;
          flex: 1;
          height: 100%;
          min-height: 0;
          background: #030a06;
          position: relative;
          overflow: hidden;
        }
        .fuel-shell::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(16,185,129,0.006) 2px,
            rgba(16,185,129,0.006) 4px
          );
          pointer-events: none;
          z-index: 0;
        }
        .fuel-shell::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 15% 50%, rgba(16,185,129,0.04) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 15%, rgba(52,211,153,0.02) 0%, transparent 45%);
          pointer-events: none;
          z-index: 0;
        }
        .fuel-content-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          position: relative;
          z-index: 1;
          overflow: visible;
        }
        .fuel-header {
          border-bottom: 1px solid rgba(16,185,129,0.09);
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(3,10,6,0.45);
          backdrop-filter: blur(2px);
          flex-shrink: 0;
          flex-wrap: wrap;
          gap: 10px;
        }
        .fuel-body {
          flex: 1;
          overflow-y: auto;
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .fuel-body::-webkit-scrollbar { width: 4px; }
        .fuel-body::-webkit-scrollbar-track { background: transparent; }
        .fuel-body::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.18); border-radius: 2px; }
        .fuel-body::-webkit-scrollbar-thumb:hover { background: rgba(16,185,129,0.35); }
        .fuel-main-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 14px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .fuel-main-grid { grid-template-columns: 1fr; }
        }
        .fuel-rail-wrapper { position: relative; z-index: 2; }
        @media (max-width: 640px) {
          .fuel-rail-wrapper { display: none; }
          .fuel-body { padding: 14px 16px; }
          .fuel-header { padding: 10px 16px; }
        }
        @keyframes fuelFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fuel-animate-in { animation: fuelFadeIn 0.22s ease-out forwards; }
      `}</style>

      <div className="fuel-shell">
        <div className="fuel-rail-wrapper">
          <FuelRail filter={filter} setFilter={setFilter} />
        </div>

        <div className="fuel-content-area">
          {/* Header */}
          <div className="fuel-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, color: "rgba(16,185,129,0.5)", textShadow: "0 0 10px rgba(16,185,129,0.3)" }}>◉</span>
              <div>
                <div style={{ fontFamily: G, fontSize: 11, letterSpacing: "0.22em", fontWeight: 700, color: "#fff" }}>
                  FUEL LOG
                </div>
                <div style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.12em", color: "rgba(16,185,129,0.4)", marginTop: 1 }}>
                  nutrition tracker
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <DateRangeDropdown from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
              <button
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px",
                  background: A,
                  border: "none", borderRadius: 4,
                  fontFamily: G, fontSize: 10, letterSpacing: "0.1em", fontWeight: 700,
                  color: "#000", cursor: "pointer",
                  boxShadow: "0 0 16px rgba(16,185,129,0.3)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(16,185,129,0.55)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(16,185,129,0.3)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }}
              >
                + LOG MEAL
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="fuel-body">
            {isLoading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", gap: 12 }}>
                <Spinner />
                <div style={{ fontFamily: G, fontSize: 9, letterSpacing: "0.2em", color: "rgba(16,185,129,0.4)" }}>LOADING...</div>
              </div>
            )}

            {error && (
              <div style={{
                border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)",
                borderRadius: 6, padding: "12px 16px",
                fontFamily: G, fontSize: 10, letterSpacing: "0.08em", color: "rgba(239,68,68,0.8)",
              }}>✕ FAILED TO LOAD FOOD DATA</div>
            )}

            {data && (
              <div className="fuel-animate-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <NutritionHero
                  totalCalories={totals.calories}
                  totalProtein_g={totals.protein}
                  totalCarb_g={totals.carbs}
                  totalFat_g={totals.fat}
                  mealCount={totals.meals}
                  dayCount={filteredDays.length}
                />

                <div className="fuel-main-grid">
                  {/* Left: Meal Log */}
                  <MealLog days={filteredDays} />

                  {/* Right: Charts */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {filteredDays.length > 1 && <MacroChart days={filteredDays} />}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

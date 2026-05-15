import { useState, useMemo } from "react";
import { useGetFood } from "@/api/cachedQueries";
import NutritionHero from "./components/NutritionHero";
import MacroChart from "./components/MacroChart";
import MealLog from "./components/MealLog";
import Spinner from "@/components/common/Spinner";
import DateRangeDropdown, { drToday } from "@/components/common/DateRangeDropdown";

const G = "'JetBrains Mono','Fira Code',monospace";
const A = "#10b981";

// ── Main page ──────────────────────────────────────────────────────────────────

export default function FoodPage() {
  const [from, setFrom] = useState(drToday);
  const [to, setTo] = useState(drToday);

  const { data, isLoading, error } = useGetFood(from, to);

  const filteredDays = useMemo(
    () => (data ? data.days : []),
    [data],
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
          overflow: visible;
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
          overflow: visible;
        }
        .fuel-header {
          border-bottom: 1px solid rgba(16,185,129,0.09);
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(3,10,6,0.45);
          flex-shrink: 0;
          flex-wrap: wrap;
          gap: 10px;
          position: relative;
          z-index: 100;
          overflow: visible;
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
        @media (max-width: 640px) {
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
              <DateRangeDropdown accent={A} panelBg="#05100a" align="right" from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
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

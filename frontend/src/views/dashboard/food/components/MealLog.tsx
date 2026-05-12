import { useState } from "react";
import type { DailyFoodSummary } from "@/schemas";
import { mealTypeDisplayLabel } from "@/schemas";
import { MealTypeLabelEnum } from "@/schemas";

const G = "'JetBrains Mono','Fira Code',monospace";

const MEAL_COLORS: Record<MealTypeLabelEnum, string> = {
  [MealTypeLabelEnum.Breakfast]: "#f59e0b",
  [MealTypeLabelEnum.Lunch]:     "#10b981",
  [MealTypeLabelEnum.Dinner]:    "#818cf8",
  [MealTypeLabelEnum.Snack]:     "#ec4899",
};

function fmtDate(iso: string) {
  const [, m, d] = iso.split("-");
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${d} ${months[parseInt(m) - 1]}`;
}

interface Props {
  days: DailyFoodSummary[];
}

export default function MealLog({ days }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (days.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "64px 0", gap: 12,
      }}>
        <div style={{ fontSize: 28, opacity: 0.2 }}>◉</div>
        <div style={{ fontFamily: G, fontSize: 10, letterSpacing: "0.2em", color: "rgba(16,185,129,0.35)" }}>
          NO MEALS LOGGED
        </div>
        <div style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.1em", color: "rgba(255,255,255,0.15)" }}>
          Select a different range or meal filter.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[...days].reverse().map(day => (
        <div key={day.date} style={{
          background: "rgba(4,18,10,0.92)",
          border: "1px solid rgba(16,185,129,0.1)",
          borderRadius: 8,
          overflow: "hidden",
        }}>
          {/* Day header */}
          <div style={{
            padding: "10px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid rgba(16,185,129,0.07)",
            background: "rgba(16,185,129,0.03)",
          }}>
            <div style={{ fontFamily: G, fontSize: 11, fontWeight: 700, color: "#ffffff", letterSpacing: "0.1em" }}>
              {fmtDate(day.date)}
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <span style={{ fontFamily: G, fontSize: 9, color: "rgba(52,211,153,0.5)" }}>
                P {day.total_protein_g.toFixed(0)}g
              </span>
              <span style={{ fontFamily: G, fontSize: 9, color: "rgba(245,158,11,0.5)" }}>
                C {day.total_carb_g.toFixed(0)}g
              </span>
              <span style={{ fontFamily: G, fontSize: 9, color: "rgba(249,115,22,0.5)" }}>
                F {day.total_fat_g.toFixed(0)}g
              </span>
              <span style={{ fontFamily: G, fontSize: 12, fontWeight: 700, color: "#10b981", letterSpacing: "0.05em" }}>
                {day.total_calories.toLocaleString()} <span style={{ fontSize: 8, opacity: 0.6 }}>kcal</span>
              </span>
            </div>
          </div>

          {/* Meals */}
          {day.meals.map(meal => {
            const key = `${day.date}-${meal.meal_type}`;
            const isOpen = expanded === key;
            const color = MEAL_COLORS[meal.meal_type];

            return (
              <div key={key}>
                <button
                  onClick={() => setExpanded(isOpen ? null : key)}
                  style={{
                    width: "100%",
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "9px 16px",
                    background: "transparent",
                    border: "none", borderBottom: "1px solid rgba(16,185,129,0.05)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(16,185,129,0.03)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  {/* Color strip */}
                  <div style={{ width: 2, height: 20, borderRadius: 1, background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}66` }} />

                  <span style={{ fontFamily: G, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color, flex: 1, textAlign: "left" }}>
                    {mealTypeDisplayLabel[meal.meal_type].toUpperCase()}
                  </span>

                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontFamily: G, fontSize: 8, color: "rgba(255,255,255,0.22)" }}>
                      {meal.items.length} item{meal.items.length !== 1 ? "s" : ""}
                    </span>
                    <span style={{ fontFamily: G, fontSize: 11, fontWeight: 700, color: "#fff" }}>
                      {meal.total_calories} <span style={{ fontSize: 8, opacity: 0.4 }}>kcal</span>
                    </span>
                    <span style={{ fontFamily: G, fontSize: 9, color: "rgba(16,185,129,0.35)", width: 10, textAlign: "center" }}>
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div style={{ padding: "6px 16px 10px 30px" }}>
                    {meal.items.map((item, i) => (
                      <div key={i} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "5px 0",
                        borderBottom: i < meal.items.length - 1 ? "1px solid rgba(16,185,129,0.04)" : "none",
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontFamily: G, fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
                            {item.name}
                            {item.amount && item.unit && (
                              <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>
                                {item.amount}{item.unit}
                              </span>
                            )}
                          </span>
                          {(item.protein_g != null || item.carb_g != null || item.fat_g != null) && (
                            <div style={{ display: "flex", gap: 8 }}>
                              {item.protein_g != null && (
                                <span style={{ fontFamily: G, fontSize: 7, color: "rgba(52,211,153,0.45)" }}>
                                  P {item.protein_g.toFixed(0)}g
                                </span>
                              )}
                              {item.carb_g != null && (
                                <span style={{ fontFamily: G, fontSize: 7, color: "rgba(245,158,11,0.45)" }}>
                                  C {item.carb_g.toFixed(0)}g
                                </span>
                              )}
                              {item.fat_g != null && (
                                <span style={{ fontFamily: G, fontSize: 7, color: "rgba(249,115,22,0.45)" }}>
                                  F {item.fat_g.toFixed(0)}g
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <span style={{ fontFamily: G, fontSize: 10, color: "rgba(255,255,255,0.45)", flexShrink: 0, marginLeft: 12 }}>
                          {item.calories} kcal
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

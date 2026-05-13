const G = "'JetBrains Mono','Fira Code',monospace";

interface Props {
  totalCalories: number;
  totalProtein_g: number;
  totalCarb_g: number;
  totalFat_g: number;
  mealCount: number;
  dayCount: number;
}

function MacroBar({ label, grams, pct, color }: { label: string; grams: number; pct: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <div style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)", width: 52, flexShrink: 0 }}>{label}</div>
      <div style={{ fontFamily: G, fontSize: 11, fontWeight: 700, color, width: 44, flexShrink: 0, textAlign: "right" }}>
        {grams.toFixed(0)}g
      </div>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 2,
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          boxShadow: `0 0 6px ${color}66`,
          transition: "width 0.6s ease",
        }} />
      </div>
      <div style={{ fontFamily: G, fontSize: 9, color: "rgba(255,255,255,0.25)", width: 30, flexShrink: 0, textAlign: "right" }}>
        {pct.toFixed(0)}%
      </div>
    </div>
  );
}

function StatPill({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: G, fontSize: 7, letterSpacing: "0.16em", color: "rgba(16,185,129,0.4)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: G, fontSize: 20, fontWeight: 700, color: "#10b981", textShadow: "0 0 12px rgba(16,185,129,0.4)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: G, fontSize: 7, color: "rgba(16,185,129,0.3)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function NutritionHero({ totalCalories, totalProtein_g, totalCarb_g, totalFat_g, mealCount, dayCount }: Props) {
  const proteinCal = totalProtein_g * 4;
  const carbCal = totalCarb_g * 4;
  const fatCal = totalFat_g * 9;
  const totalMacroCal = proteinCal + carbCal + fatCal;

  const pPct = totalMacroCal > 0 ? (proteinCal / totalMacroCal) * 100 : 0;
  const cPct = totalMacroCal > 0 ? (carbCal / totalMacroCal) * 100 : 0;
  const fPct = totalMacroCal > 0 ? (fatCal / totalMacroCal) * 100 : 0;

  const avgPerMeal = mealCount > 0 ? Math.round(totalCalories / mealCount) : 0;
  const avgPerDay = dayCount > 1 ? Math.round(totalCalories / dayCount) : null;

  return (
    <div style={{
      background: "rgba(4,18,10,0.92)",
      border: "1px solid rgba(16,185,129,0.18)",
      borderRadius: 8,
      padding: "18px 22px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 10% 50%, rgba(16,185,129,0.07) 0%, transparent 60%)",
      }} />
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.35), transparent)",
      }} />

      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
        {/* Big calorie number */}
        <div style={{ minWidth: 110 }}>
          <div style={{ fontFamily: G, fontSize: 7, letterSpacing: "0.22em", color: "rgba(16,185,129,0.45)", marginBottom: 6 }}>
            TOTAL FUEL
          </div>
          <div style={{ fontFamily: G, fontSize: 40, fontWeight: 700, lineHeight: 1, color: "#10b981", textShadow: "0 0 24px rgba(16,185,129,0.35)" }}>
            {totalCalories.toLocaleString()}
          </div>
          <div style={{ fontFamily: G, fontSize: 9, letterSpacing: "0.18em", color: "rgba(16,185,129,0.35)", marginTop: 4 }}>
            kcal
          </div>
          {avgPerMeal > 0 && (
            <div style={{ fontFamily: G, fontSize: 8, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>
              Ø {avgPerMeal} kcal / meal
            </div>
          )}
        </div>

        <div style={{ width: 1, alignSelf: "stretch", background: "rgba(16,185,129,0.1)", flexShrink: 0 }} />

        {/* Macro bars */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: G, fontSize: 7, letterSpacing: "0.2em", color: "rgba(16,185,129,0.4)", marginBottom: 10 }}>
            MACROS
          </div>
          <MacroBar label="PROTEIN" grams={totalProtein_g} pct={pPct} color="#34d399" />
          <MacroBar label="CARBS" grams={totalCarb_g} pct={cPct} color="#f59e0b" />
          <MacroBar label="FAT" grams={totalFat_g} pct={fPct} color="#f97316" />
        </div>

        <div style={{ width: 1, alignSelf: "stretch", background: "rgba(16,185,129,0.1)", flexShrink: 0 }} />

        {/* Stats */}
        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <StatPill label="MEALS" value={`${mealCount}`} />
          {dayCount > 1 && <StatPill label="DAYS" value={`${dayCount}`} />}
          {avgPerDay !== null && <StatPill label="AVG / DAY" value={avgPerDay.toLocaleString()} sub="kcal" />}
        </div>
      </div>
    </div>
  );
}

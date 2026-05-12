import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { DailyFoodSummary } from "@/schemas";
import { MealTypeLabelEnum } from "@/schemas";

const G = "'JetBrains Mono','Fira Code',monospace";

const MEAL_COLORS: Record<MealTypeLabelEnum, string> = {
  [MealTypeLabelEnum.Breakfast]: "#f59e0b",
  [MealTypeLabelEnum.Lunch]:     "#10b981",
  [MealTypeLabelEnum.Dinner]:    "#818cf8",
  [MealTypeLabelEnum.Snack]:     "#ec4899",
};

const MEAL_LABELS: Record<MealTypeLabelEnum, string> = {
  [MealTypeLabelEnum.Breakfast]: "BREAKFAST",
  [MealTypeLabelEnum.Lunch]:     "LUNCH",
  [MealTypeLabelEnum.Dinner]:    "DINNER",
  [MealTypeLabelEnum.Snack]:     "SNACK",
};

interface Props {
  days: DailyFoodSummary[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div style={{
      background: "#0a160e", border: "1px solid rgba(16,185,129,0.2)",
      borderRadius: 6, padding: "10px 14px",
      fontFamily: G, fontSize: 10,
    }}>
      <div style={{ color: "rgba(16,185,129,0.6)", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</div>
      {payload.map(p => p.value > 0 && (
        <div key={p.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
          <span style={{ color: p.fill }}>{p.name}</span>
          <span style={{ color: "#fff" }}>{p.value} kcal</span>
        </div>
      ))}
      <div style={{ borderTop: "1px solid rgba(16,185,129,0.1)", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "rgba(16,185,129,0.5)" }}>TOTAL</span>
        <span style={{ color: "#10b981", fontWeight: 700 }}>{total} kcal</span>
      </div>
    </div>
  );
}

export default function MacroChart({ days }: Props) {
  const data = days.map(d => {
    const row: Record<string, string | number> = { date: d.date.slice(5) };
    for (const meal of d.meals) {
      row[MEAL_LABELS[meal.meal_type]] = meal.total_calories;
    }
    return row;
  });

  const usedTypes = Array.from(
    new Set(days.flatMap(d => d.meals.map(m => m.meal_type)))
  );

  return (
    <div style={{
      background: "rgba(4,18,10,0.92)",
      border: "1px solid rgba(16,185,129,0.12)",
      borderRadius: 8,
      padding: "16px 20px",
    }}>
      <div style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.2em", color: "rgba(16,185,129,0.5)", marginBottom: 16 }}>
        DAILY CALORIES
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={22} barGap={2}>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(16,185,129,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fontFamily: G, fill: "rgba(255,255,255,0.3)" }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fontFamily: G, fill: "rgba(255,255,255,0.2)" }}
            axisLine={false} tickLine={false} width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16,185,129,0.04)" }} />
          <Legend
            wrapperStyle={{ fontFamily: G, fontSize: 8, letterSpacing: "0.1em", paddingTop: 12 }}
            formatter={v => <span style={{ color: "rgba(255,255,255,0.4)" }}>{v}</span>}
          />
          {usedTypes.map(mt => (
            <Bar
              key={mt}
              dataKey={MEAL_LABELS[mt]}
              stackId="a"
              fill={MEAL_COLORS[mt]}
              radius={usedTypes.indexOf(mt) === usedTypes.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyBodyMeasurement } from "@/schemas";

interface Props {
  measurements: DailyBodyMeasurement[];
  unit: string;
}

export default function BodyChart({ measurements, unit }: Props) {
  const data = measurements.map((m) => ({
    date: m.date.slice(5),
    value: Math.round(m.avg_value * 100) / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2a1a" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#9ca3af" }}
          formatter={(v) => [`${Number(v ?? 0)} ${unit}`, "Avg"]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#bodyGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#22c55e" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

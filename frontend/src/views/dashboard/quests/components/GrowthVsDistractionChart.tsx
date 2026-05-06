import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { GrowthVsDistraction } from "@/schemas";

interface Props {
  data: GrowthVsDistraction;
}

export default function GrowthVsDistractionChart({ data }: Props) {
  const growthH = +(data.growth_minutes / 60).toFixed(1);
  const distractionH = +(data.distraction_minutes / 60).toFixed(1);

  const chartData = [{ name: "This period", Growth: growthH, Distraction: distractionH }];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Growth vs Distraction</h3>
      <div className="flex items-center gap-6 mb-4">
        <div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Growth</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{growthH}h</div>
        </div>
        <div className="h-10 w-px bg-gray-100 dark:bg-gray-800" />
        <div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Distraction</div>
          <div className="text-2xl font-bold text-red-500 dark:text-red-400">{distractionH}h</div>
        </div>
        <div className="h-10 w-px bg-gray-100 dark:bg-gray-800" />
        <div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Focus Score</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{Math.round(data.growth_pct)}%</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={chartData} layout="vertical" barSize={20}>
          <XAxis type="number" unit="h" tick={{ fontSize: 10 }} />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(v) => [`${v}h`, ""]}
          />
          <Legend formatter={v => <span style={{ fontSize: 11 }}>{v}</span>} />
          <Bar dataKey="Growth" stackId="a" fill="#10b981" radius={[4, 0, 0, 4]} />
          <Bar dataKey="Distraction" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

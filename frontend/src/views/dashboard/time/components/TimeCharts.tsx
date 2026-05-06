import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { GetTimeSummaryResponse } from "@/schemas";

interface Props {
  data: GetTimeSummaryResponse;
  multiDay: boolean;
}

export default function TimeCharts({ data, multiDay }: Props) {
  const pieData = data.byBucket.map(b => ({
    name: b.bucket_name,
    value: b.total_minutes,
    fill: b.bucket_color,
    hours: (b.total_minutes / 60).toFixed(1),
  }));

  if (!multiDay) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Time by Bucket
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [`${(Number(v ?? 0) / 60).toFixed(1)}h`, ""]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const bucketNames = [...new Set(data.byBucket.map(b => b.bucket_name))];
  const bucketColorMap = Object.fromEntries(data.byBucket.map(b => [b.bucket_name, b.bucket_color]));

  const stackedData = data.days.map(day => {
    const entry: Record<string, string | number> = { date: day.date.slice(5) };
    for (const b of day.buckets) {
      entry[b.bucket_name] = parseFloat((b.total_minutes / 60).toFixed(1));
    }
    return entry;
  });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Daily Hours by Bucket
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={stackedData} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} unit="h" />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(v) => [`${Number(v ?? 0)}h`, ""]}
          />
          <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
          {bucketNames.map(name => (
            <Bar key={name} dataKey={name} stackId="a" fill={bucketColorMap[name]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

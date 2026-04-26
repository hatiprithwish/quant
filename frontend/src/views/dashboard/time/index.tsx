import { useState } from "react";
import { useGetTime } from "@/api/cachedQueries";
import DateRangeSelector from "@/components/common/DateRangeSelector";
import TimeCharts from "./components/TimeCharts";
import { timeBucketDisplayLabel, timeBucketColor } from "@/schemas";

function today() {
  return new Date().toISOString().split("T")[0];
}

function fmtMins(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TimePage() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());

  const { data, isLoading, error } = useGetTime(from, to);
  const multiDay = from !== to;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">Time Tracker</h2>
        <DateRangeSelector
          group="time"
          from={from}
          to={to}
          onChange={(f, t) => { setFrom(f); setTo(t); }}
        />
      </div>

      {isLoading && (
        <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          Failed to load time data.
        </div>
      )}

      {data && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <span className="text-sm text-gray-500">Total tracked</span>
            <span className="text-3xl font-bold text-gray-900">
              {fmtMins(data.totalMinutes)}
            </span>
          </div>

          {data.byBucket.length > 0 && (
            <TimeCharts data={data} multiDay={multiDay} />
          )}

          <div className="grid grid-cols-2 gap-3">
            {data.byBucket.map((b) => (
              <div
                key={b.bucket}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: timeBucketColor[b.bucket] }}
                />
                <span className="text-sm text-gray-700 flex-1">
                  {timeBucketDisplayLabel[b.bucket]}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {fmtMins(b.total_minutes)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
              Activity Log
            </div>
            {data.days.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No time logged for this period.
              </div>
            ) : (
              data.days
                .slice()
                .reverse()
                .flatMap((day) =>
                  day.buckets.flatMap((b) =>
                    b.activities.map((a) => ({ ...a, dayDate: day.date }))
                  )
                )
                .sort((a, b) => b.start_time.localeCompare(a.start_time))
                .map((a) => (
                  <div
                    key={a.id}
                    className="px-5 py-2.5 flex items-center gap-3 border-t border-gray-50 text-sm"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: timeBucketColor[a.bucket] }}
                    />
                    <span className="flex-1 text-gray-800">{a.activity}</span>
                    <span className="text-xs text-gray-400">
                      {a.start_time.slice(11, 16)} – {a.end_time.slice(11, 16)}
                    </span>
                    <span className="text-xs font-medium text-gray-600 w-14 text-right">
                      {fmtMins(a.duration_minutes)}
                    </span>
                  </div>
                ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

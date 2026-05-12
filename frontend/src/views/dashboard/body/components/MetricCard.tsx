import { useState } from "react";
import type { BodyMetricItem } from "@/schemas";
import { useGetBodyMeasurements } from "@/api/cachedQueries";
import { useMutationDeleteBodyMetric } from "@/api/mutations";
import DateRangeDropdown, { getPresetRange } from "@/components/common/DateRangeDropdown";
import BodyChart from "./BodyChart";
import EditMetricModal from "./EditMetricModal";
import LogMeasurementModal from "./LogMeasurementModal";

interface Props {
  metric: BodyMetricItem;
}

export default function MetricCard({ metric }: Props) {
  const [from, setFrom] = useState(() => getPresetRange("thisMonth").from);
  const [to, setTo] = useState(() => getPresetRange("thisMonth").to);
  const [showEdit, setShowEdit] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading } = useGetBodyMeasurements(metric.id, from, to);
  const { mutate: deleteMetric, isPending: isDeleting } = useMutationDeleteBodyMetric();

  const latest = data?.measurements?.at(-1);

  return (
    <>
      <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-100">{metric.name}</h3>
            <span className="text-xs text-gray-500">{metric.unit}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowLog(true)}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-green-900/40 text-green-400 hover:bg-green-900/70 transition-colors"
            >
              + Log
            </button>
            <button
              onClick={() => setShowEdit(true)}
              title="Edit"
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete"
                className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Delete?</span>
                <button
                  onClick={() => deleteMetric(metric.id, { onSuccess: () => setShowDeleteConfirm(false) })}
                  disabled={isDeleting}
                  className="px-2 py-0.5 rounded text-xs text-red-400 border border-red-800 hover:bg-red-950 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-0.5 rounded text-xs text-gray-400 border border-gray-700 hover:bg-gray-800 transition-colors"
                >
                  No
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Latest reading */}
        {latest && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-gray-100">
              {Math.round(latest.avg_value * 100) / 100}
            </span>
            <span className="text-sm text-gray-500">{metric.unit}</span>
            <span className="text-xs text-gray-600 ml-1">on {latest.date}</span>
          </div>
        )}

        {/* Date range */}
        <DateRangeDropdown
          accent="#818cf8"
          panelBg="#0a0a14"
          from={from}
          to={to}
          onChange={(f, t) => { setFrom(f); setTo(t); }}
        />

        {/* Chart */}
        {isLoading && (
          <div className="h-[180px] flex items-center justify-center text-xs text-gray-600">Loading…</div>
        )}
        {data && data.measurements.length === 0 && (
          <div className="h-[180px] flex items-center justify-center text-xs text-gray-600">
            No data for this range. Log your first measurement!
          </div>
        )}
        {data && data.measurements.length > 0 && (
          <BodyChart measurements={data.measurements} unit={metric.unit} />
        )}
      </div>

      {showEdit && <EditMetricModal metric={metric} onClose={() => setShowEdit(false)} />}
      {showLog && <LogMeasurementModal metric={metric} onClose={() => setShowLog(false)} />}
    </>
  );
}

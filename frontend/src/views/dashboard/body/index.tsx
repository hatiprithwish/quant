import { useState } from "react";
import { useGetBodyMetrics } from "@/api/cachedQueries";
import AddMetricModal from "./components/AddMetricModal";
import MetricCard from "./components/MetricCard";

export default function BodyPage() {
  const [showAdd, setShowAdd] = useState(false);
  const { data, isLoading, error } = useGetBodyMetrics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Body</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-500 text-white transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add metric
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">Loading…</div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          Failed to load metrics.
        </div>
      )}

      {data && data.metrics.length === 0 && !isLoading && (
        <div className="text-center py-16 text-gray-500 dark:text-gray-600 text-sm">
          <div className="mb-3 text-4xl">📏</div>
          <p className="font-medium text-gray-400">No metrics yet</p>
          <p className="mt-1">Add your first metric to start tracking.</p>
        </div>
      )}

      {data && data.metrics.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {data.metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      )}

      {showAdd && <AddMetricModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

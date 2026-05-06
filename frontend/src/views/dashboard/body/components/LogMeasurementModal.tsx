import { useState } from "react";
import { useMutationCreateBodyMeasurement } from "@/api/mutations";
import type { BodyMetricItem } from "@/schemas";

function today() {
  return new Date().toISOString().split("T")[0];
}

interface Props {
  metric: BodyMetricItem;
  onClose: () => void;
}

export default function LogMeasurementModal({ metric, onClose }: Props) {
  const [value, setValue] = useState("");
  const [recordedAt, setRecordedAt] = useState(today());
  const { mutate, isPending } = useMutationCreateBodyMeasurement(metric.id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(value);
    if (isNaN(num) || !recordedAt) return;
    mutate(
      { metric_id: metric.id, value: num, recorded_at: recordedAt },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-base font-semibold text-gray-100 mb-1">
          Log <span className="text-green-400">{metric.name}</span>
        </h3>
        <p className="text-xs text-gray-500 mb-4">Unit: {metric.unit}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Value ({metric.unit})</label>
            <input
              autoFocus
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`e.g. 75`}
              className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-100 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
            <input
              type="date"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-100 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !value || isNaN(parseFloat(value))}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white transition-colors"
            >
              {isPending ? "Logging…" : "Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

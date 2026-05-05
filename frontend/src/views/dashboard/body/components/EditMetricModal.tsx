import { useState } from "react";
import { useMutationUpdateBodyMetric } from "@/api/mutations";
import type { BodyMetricItem } from "@/schemas";

interface Props {
  metric: BodyMetricItem;
  onClose: () => void;
}

export default function EditMetricModal({ metric, onClose }: Props) {
  const [name, setName] = useState(metric.name);
  const { mutate, isPending } = useMutationUpdateBodyMetric(metric.id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim() === metric.name) { onClose(); return; }
    mutate({ name: name.trim() }, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-base font-semibold text-gray-100 mb-1">Edit metric</h3>
        {metric.locked && (
          <p className="text-xs text-amber-400 mb-3">Unit is locked after the first log entry and cannot be changed.</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-100 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Unit</label>
            <input
              value={metric.unit}
              disabled
              className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-500 text-sm px-3 py-2 cursor-not-allowed"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white transition-colors"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

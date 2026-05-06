import { useState } from "react";
import { useMutationCreateBodyMetric } from "@/api/mutations";

interface Props {
  onClose: () => void;
}

export default function AddMetricModal({ onClose }: Props) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const { mutate, isPending, error } = useMutationCreateBodyMetric();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !unit.trim()) return;
    mutate({ name: name.trim(), unit: unit.trim() }, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-base font-semibold text-gray-100 mb-4">Add metric</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weight, Bicep"
              className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-100 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Unit</label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. kg, cm, bpm"
              className="w-full rounded-lg bg-gray-900 border border-gray-700 text-gray-100 text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500 placeholder:text-gray-600"
            />
          </div>
          {error && (
            <p className="text-xs text-red-400">Failed to create metric. Try again.</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim() || !unit.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white transition-colors"
            >
              {isPending ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

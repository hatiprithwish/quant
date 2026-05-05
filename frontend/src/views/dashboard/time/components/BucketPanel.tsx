import { useState } from "react";
import {
  useMutationCreateTimeBucket,
  useMutationUpdateTimeBucket,
  useMutationDeleteTimeBucket,
  type CreateTimeBucketInput,
} from "@/api/mutations";
import { useGetTimeBuckets, useGetQuestsDashboard } from "@/api/cachedQueries";
import type { TimeBucketItem } from "@/schemas";

const COLOR_SWATCHES = [
  "#3b82f6","#8b5cf6","#ec4899","#ef4444","#f97316",
  "#eab308","#22c55e","#14b8a6","#06b6d4","#6b7280",
];

function today() { return new Date().toISOString().split("T")[0]; }

function BucketRow({ bucket, questNames }: { bucket: TimeBucketItem; questNames: Record<string, string> }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(bucket.name);
  const [color, setColor] = useState(bucket.color);
  const [isDistraction, setIsDistraction] = useState(bucket.is_distraction);
  const [questId, setQuestId] = useState<string | null>(bucket.quest_id ?? null);

  const update = useMutationUpdateTimeBucket(bucket.id);
  const del = useMutationDeleteTimeBucket();

  function save() {
    update.mutate(
      { name, color, is_distraction: isDistraction, quest_id: questId },
      { onSuccess: () => setEditing(false) }
    );
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3 py-2.5 px-4 border-t border-gray-50 dark:border-gray-800">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: bucket.color }} />
        <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{bucket.name}</span>
        {bucket.is_distraction && (
          <span className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 px-1.5 py-0.5 rounded">distraction</span>
        )}
        {bucket.quest_name && (
          <span className="text-xs text-indigo-500 dark:text-indigo-400 truncate max-w-24">{bucket.quest_name}</span>
        )}
        <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">Edit</button>
        <button
          onClick={() => del.mutate(bucket.id)}
          disabled={del.isPending}
          className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
        >Del</button>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-800 space-y-2">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-400"
        />
        <button onClick={save} disabled={update.isPending} className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-500 disabled:opacity-50">Save</button>
        <button onClick={() => setEditing(false)} className="text-xs px-2 py-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="flex gap-1 flex-wrap">
        {COLOR_SWATCHES.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`w-5 h-5 rounded-full ${color === c ? "ring-2 ring-offset-1 ring-gray-400 dark:ring-offset-gray-900" : ""}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isDistraction}
            onChange={e => setIsDistraction(e.target.checked)}
            className="rounded"
          />
          <span className="text-gray-600 dark:text-gray-400">Distraction</span>
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 dark:text-gray-400">Quest:</span>
          <select
            value={questId ?? ""}
            onChange={e => setQuestId(e.target.value || null)}
            className="text-xs px-1.5 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none"
          >
            <option value="">None</option>
            {Object.entries(questNames).map(([id, n]) => (
              <option key={id} value={id}>{n}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function AddBucketForm({ questNames, onDone }: { questNames: Record<string, string>; onDone: () => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [isDistraction, setIsDistraction] = useState(false);
  const [questId, setQuestId] = useState<string | null>(null);

  const create = useMutationCreateTimeBucket();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const input: CreateTimeBucketInput = { name: name.trim(), color, is_distraction: isDistraction, quest_id: questId };
    create.mutate(input, { onSuccess: onDone });
  }

  return (
    <form onSubmit={submit} className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
      <div className="flex gap-2">
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Bucket name"
          className="flex-1 text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-400"
          required
        />
        <button type="submit" disabled={create.isPending || !name.trim()} className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-500 disabled:opacity-50">Add</button>
        <button type="button" onClick={onDone} className="text-xs px-2 py-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="flex gap-1 flex-wrap">
        {COLOR_SWATCHES.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`w-5 h-5 rounded-full ${color === c ? "ring-2 ring-offset-1 ring-gray-400 dark:ring-offset-gray-900" : ""}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={isDistraction} onChange={e => setIsDistraction(e.target.checked)} className="rounded" />
          <span className="text-gray-600 dark:text-gray-400">Distraction</span>
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 dark:text-gray-400">Quest:</span>
          <select
            value={questId ?? ""}
            onChange={e => setQuestId(e.target.value || null)}
            className="text-xs px-1.5 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none"
          >
            <option value="">None</option>
            {Object.entries(questNames).map(([id, n]) => (
              <option key={id} value={id}>{n}</option>
            ))}
          </select>
        </div>
      </div>
    </form>
  );
}

export default function BucketPanel() {
  const [showAdd, setShowAdd] = useState(false);
  const { data: bucketsData } = useGetTimeBuckets();
  const { data: questsData } = useGetQuestsDashboard(
    new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split("T")[0],
    today()
  );

  const questNames: Record<string, string> = {};
  if (questsData?.quests) {
    for (const q of questsData.quests) questNames[q.id] = q.name;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Buckets</span>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New
        </button>
      </div>

      {showAdd && <AddBucketForm questNames={questNames} onDone={() => setShowAdd(false)} />}

      {!bucketsData || bucketsData.buckets.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-400 dark:text-gray-500">No buckets</div>
      ) : (
        bucketsData.buckets.map(b => (
          <BucketRow key={b.id} bucket={b} questNames={questNames} />
        ))
      )}
    </div>
  );
}

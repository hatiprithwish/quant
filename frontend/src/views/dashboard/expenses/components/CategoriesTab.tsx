import { useState } from "react";
import type { MoneyCategoryItem } from "@/schemas";
import { MoneyCategoryTypeEnum } from "@/schemas";
import { useGetMoneyCategories } from "@/api/cachedQueries";
import {
  useMutationCreateMoneyCategory,
  useMutationUpdateMoneyCategory,
  useMutationDeleteMoneyCategory,
} from "@/api/mutations";

const COLOR_SWATCHES = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#ec4899", "#f43f5e", "#64748b",
];

function slugify(val: string) {
  return val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

interface CategoryFormProps {
  initial?: MoneyCategoryItem;
  onSave: (data: { name?: string; display_label: string; color: string; type?: MoneyCategoryTypeEnum }) => Promise<void>;
  onCancel: () => void;
  isCreate: boolean;
}

function CategoryForm({ initial, onSave, onCancel, isCreate }: CategoryFormProps) {
  const [displayLabel, setDisplayLabel] = useState(initial?.display_label ?? "");
  const [color, setColor] = useState(initial?.color ?? COLOR_SWATCHES[5]);
  const [type, setType] = useState<MoneyCategoryTypeEnum>(initial?.type ?? MoneyCategoryTypeEnum.Expense);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!displayLabel.trim()) return setError("Enter a category name.");
    setSaving(true);
    try {
      await onSave({
        ...(isCreate ? { name: slugify(displayLabel.trim()), type } : {}),
        display_label: displayLabel.trim(),
        color,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-500";
  const labelCls = "block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-xl border border-gray-200 dark:border-neutral-700">
      {isCreate && (
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-700">
          {[MoneyCategoryTypeEnum.Expense, MoneyCategoryTypeEnum.Income].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                type === t
                  ? t === MoneyCategoryTypeEnum.Expense
                    ? "bg-red-500 text-white"
                    : "bg-emerald-500 text-white"
                  : "text-gray-400 dark:text-neutral-500 hover:bg-gray-100 dark:hover:bg-neutral-700"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div>
        <label className={labelCls}>Name</label>
        <input
          type="text"
          value={displayLabel}
          onChange={(e) => setDisplayLabel(e.target.value)}
          placeholder="e.g. Groceries"
          maxLength={50}
          className={inputCls}
          autoFocus
        />
      </div>

      <div>
        <label className={labelCls}>Color</label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-110" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : isCreate ? "Create" : "Save"}
        </button>
      </div>
    </form>
  );
}

interface CategoryRowProps {
  cat: MoneyCategoryItem;
  onEdit: () => void;
}

function CategoryRow({ cat, onEdit }: CategoryRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 dark:border-neutral-800 last:border-0">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
        <span className="text-sm text-gray-800 dark:text-neutral-100">{cat.display_label}</span>
      </div>
      <button
        onClick={onEdit}
        className="text-xs text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors"
      >
        Edit
      </button>
    </div>
  );
}

interface EditRowProps {
  cat: MoneyCategoryItem;
  onDone: () => void;
}

function EditRow({ cat, onDone }: EditRowProps) {
  const updateMutation = useMutationUpdateMoneyCategory(cat.id);
  const deleteMutation = useMutationDeleteMoneyCategory();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(cat.id);
      onDone();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDeleteError(msg || "Cannot delete this category.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="px-4 py-3 border-b border-gray-50 dark:border-neutral-800 last:border-0 space-y-3">
      <CategoryForm
        initial={cat}
        isCreate={false}
        onSave={async (data) => {
          await updateMutation.mutateAsync({ display_label: data.display_label, color: data.color });
          onDone();
        }}
        onCancel={onDone}
      />

      {deleteError && <p className="text-xs text-red-500 dark:text-red-400">{deleteError}</p>}

      {!confirmDelete ? (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="text-xs text-red-500 dark:text-red-400 hover:underline"
        >
          Delete category
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-neutral-400">Delete "{cat.display_label}"?</span>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs text-gray-400 hover:underline"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-500 hover:underline disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Confirm"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function CategoriesTab() {
  const { data, isLoading } = useGetMoneyCategories();
  const createMutation = useMutationCreateMoneyCategory();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const expenseCategories = data?.categories.filter((c) => c.type === MoneyCategoryTypeEnum.Expense) ?? [];
  const incomeCategories = data?.categories.filter((c) => c.type === MoneyCategoryTypeEnum.Income) ?? [];

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400 dark:text-neutral-500 text-sm">Loading…</div>;
  }

  function renderSection(title: string, cats: MoneyCategoryItem[]) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide">{title}</span>
          <span className="text-xs text-gray-400 dark:text-neutral-500">{cats.length}</span>
        </div>
        {cats.length === 0 ? (
          <div className="px-4 py-4 text-sm text-gray-400 dark:text-neutral-500">No categories yet.</div>
        ) : (
          cats.map((cat) =>
            editingId === cat.id ? (
              <EditRow key={cat.id} cat={cat} onDone={() => setEditingId(null)} />
            ) : (
              <CategoryRow
                key={cat.id}
                cat={cat}
                onEdit={() => { setEditingId(cat.id); setShowCreate(false); }}
              />
            )
          )
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-neutral-500">
          Categories shared across expenses, income, budgets, and recurring transactions.
        </p>
        <button
          onClick={() => { setShowCreate((v) => !v); setEditingId(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors whitespace-nowrap"
        >
          + New Category
        </button>
      </div>

      {showCreate && (
        <CategoryForm
          isCreate
          onSave={async (data) => {
            await createMutation.mutateAsync({
              name: data.name!,
              display_label: data.display_label,
              color: data.color,
              type: data.type!,
            });
            setShowCreate(false);
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {renderSection("Expense", expenseCategories)}
      {renderSection("Income", incomeCategories)}
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useGetBucketEntries, useGetTimeBuckets } from "@/api/cachedQueries";
import { useMutationDeleteTimeEntry } from "@/api/mutations";
import { apiClient } from "@/api/apiClient";
import type { TimeActivity, TimeBucketItem } from "@/schemas";
import LogTimeModal from "./components/LogTimeModal";

const G = "'JetBrains Mono','Fira Code',monospace";
const A = "#06b6d4";
const PAGE_SIZE = 25;

function fmtTime(iso: string) {
  return iso.slice(11, 16);
}
function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][parseInt(m) - 1]} ${y}`;
}
function fmtDuration(mins: number) {
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Bulk Edit Modal ───────────────────────────────────────────────────────────

interface BulkEditModalProps {
  entries: TimeActivity[];
  buckets: TimeBucketItem[];
  onClose: () => void;
  onDone: () => void;
}

function BulkEditModal({
  entries,
  buckets,
  onClose,
  onDone,
}: BulkEditModalProps) {
  const [newBucketId, setNewBucketId] = useState<string>("");
  const [newActivity, setNewActivity] = useState<string>("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<number | null>(null);

  const activeBuckets = buckets.filter((b) => !b.is_archived);

  async function handleApply() {
    if (!newBucketId && !newActivity.trim()) {
      setError("Set at least one field to update.");
      return;
    }
    setError("");
    setProgress(0);

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const patch: Record<string, unknown> = {};
      if (newBucketId) patch.bucket_id = Number(newBucketId);
      if (newActivity.trim()) patch.activity = newActivity.trim();
      await apiClient.patch(`/api/time-entry/${entry.id}`, patch);
      setProgress(i + 1);
    }

    onDone();
  }

  const selectedBucket = activeBuckets.find(
    (b) => String(b.id) === newBucketId,
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#030e12",
          border: "1px solid rgba(6,182,212,0.2)",
          borderRadius: 10,
          width: "100%",
          maxWidth: 460,
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(6,182,212,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: G,
                fontSize: 11,
                letterSpacing: "0.2em",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              BULK EDIT
            </div>
            <div
              style={{
                fontFamily: G,
                fontSize: 8,
                letterSpacing: "0.12em",
                color: "rgba(6,182,212,0.45)",
                marginTop: 2,
              }}
            >
              {entries.length} {entries.length === 1 ? "entry" : "entries"}{" "}
              selected
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(6,182,212,0.4)",
              cursor: "pointer",
              fontSize: 16,
              padding: 4,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = A;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "rgba(6,182,212,0.4)";
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              fontFamily: G,
              fontSize: 9,
              color: "rgba(255,255,255,0.3)",
              background: "rgba(6,182,212,0.04)",
              border: "1px solid rgba(6,182,212,0.08)",
              borderRadius: 5,
              padding: "8px 12px",
              lineHeight: 1.6,
            }}
          >
            Leave a field blank to keep its current value.
          </div>

          {/* Move to bucket */}
          <div>
            <label
              style={{
                fontFamily: G,
                fontSize: 8,
                letterSpacing: "0.15em",
                color: "rgba(6,182,212,0.5)",
                display: "block",
                marginBottom: 5,
              }}
            >
              MOVE TO BUCKET
            </label>
            <div style={{ position: "relative" }}>
              {selectedBucket && (
                <div
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: selectedBucket.color,
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                />
              )}
              <select
                value={newBucketId}
                onChange={(e) => setNewBucketId(e.target.value)}
                style={
                  {
                    width: "100%",
                    background: "rgba(6,182,212,0.05)",
                    border: "1px solid rgba(6,182,212,0.2)",
                    borderRadius: 5,
                    padding: selectedBucket ? "7px 10px 7px 26px" : "7px 10px",
                    fontFamily: G,
                    fontSize: 11,
                    color: "#fff",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                  } as React.CSSProperties
                }
                onFocus={(e) => {
                  (e.currentTarget as HTMLSelectElement).style.borderColor = A;
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLSelectElement).style.borderColor =
                    "rgba(6,182,212,0.2)";
                }}
              >
                <option value="" style={{ background: "#030e12" }}>
                  Keep current bucket…
                </option>
                {activeBuckets.map((b) => (
                  <option
                    key={b.id}
                    value={String(b.id)}
                    style={{ background: "#030e12" }}
                  >
                    {b.name}
                  </option>
                ))}
              </select>
              <div
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(6,182,212,0.4)",
                  fontSize: 9,
                  pointerEvents: "none",
                }}
              >
                ▾
              </div>
            </div>
          </div>

          {/* Change activity */}
          <div>
            <label
              style={{
                fontFamily: G,
                fontSize: 8,
                letterSpacing: "0.15em",
                color: "rgba(6,182,212,0.5)",
                display: "block",
                marginBottom: 5,
              }}
            >
              ACTIVITY DESCRIPTION
            </label>
            <input
              type="text"
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              placeholder="Leave blank to keep current…"
              style={
                {
                  width: "100%",
                  background: "rgba(6,182,212,0.05)",
                  border: "1px solid rgba(6,182,212,0.2)",
                  borderRadius: 5,
                  padding: "7px 10px",
                  fontFamily: G,
                  fontSize: 11,
                  color: "#fff",
                  outline: "none",
                  boxSizing: "border-box",
                } as React.CSSProperties
              }
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = A;
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor =
                  "rgba(6,182,212,0.2)";
              }}
            />
          </div>

          {error && (
            <div
              style={{
                fontFamily: G,
                fontSize: 10,
                color: "rgba(239,68,68,0.85)",
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 4,
                padding: "6px 10px",
              }}
            >
              {error}
            </div>
          )}
          {progress !== null && (
            <div
              style={{
                fontFamily: G,
                fontSize: 9,
                color: "rgba(6,182,212,0.6)",
              }}
            >
              Updating {progress}/{entries.length}…
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              paddingTop: 4,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "7px 14px",
                background: "transparent",
                border: "1px solid rgba(6,182,212,0.15)",
                borderRadius: 5,
                fontFamily: G,
                fontSize: 10,
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color =
                  "rgba(255,255,255,0.4)";
              }}
            >
              CANCEL
            </button>
            <button
              onClick={handleApply}
              disabled={progress !== null}
              style={{
                padding: "7px 18px",
                background: progress !== null ? "rgba(6,182,212,0.3)" : A,
                border: "none",
                borderRadius: 5,
                fontFamily: G,
                fontSize: 10,
                letterSpacing: "0.1em",
                fontWeight: 700,
                color: progress !== null ? "rgba(255,255,255,0.5)" : "#000",
                cursor: progress !== null ? "not-allowed" : "pointer",
                boxShadow:
                  progress !== null ? "none" : "0 0 16px rgba(6,182,212,0.4)",
              }}
            >
              {progress !== null ? "APPLYING…" : "APPLY"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Entry Row ─────────────────────────────────────────────────────────────────

interface EntryRowProps {
  entry: TimeActivity;
  selected: boolean;
  onSelect: (id: number, val: boolean) => void;
  onEdit: (entry: TimeActivity) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

function EntryRow({
  entry,
  selected,
  onSelect,
  onEdit,
  onDelete,
  isDeleting,
}: EntryRowProps) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setConfirmDelete(false);
      }}
      style={{
        display: "grid",
        gridTemplateColumns: "28px 1fr auto",
        alignItems: "center",
        gap: 10,
        padding: "9px 14px",
        background: selected
          ? "rgba(6,182,212,0.07)"
          : hovered
            ? "rgba(6,182,212,0.03)"
            : "transparent",
        borderBottom: "1px solid rgba(6,182,212,0.06)",
        transition: "background 0.12s",
      }}
    >
      {/* Checkbox */}
      <div
        onClick={() => onSelect(entry.id, !selected)}
        style={{
          width: 14,
          height: 14,
          borderRadius: 3,
          flexShrink: 0,
          border: `1px solid ${selected ? A : "rgba(6,182,212,0.25)"}`,
          background: selected ? A : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.12s",
        }}
      >
        {selected && (
          <span style={{ color: "#000", fontSize: 9, lineHeight: 1 }}>✓</span>
        )}
      </div>

      {/* Content */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 3,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: entry.bucket_color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: G,
              fontSize: 9,
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.5)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {entry.bucket_name}
          </span>
          <span
            style={{
              fontFamily: G,
              fontSize: 8,
              color: "rgba(255,255,255,0.2)",
              flexShrink: 0,
            }}
          >
            {fmtDate(entry.started_at.slice(0, 10))}
          </span>
        </div>
        <div
          style={{
            fontFamily: G,
            fontSize: 11,
            color: "rgba(255,255,255,0.8)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {entry.activity}
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 3,
            fontFamily: G,
            fontSize: 8,
            color: "rgba(6,182,212,0.4)",
          }}
        >
          <span>
            {fmtTime(entry.started_at)} → {fmtTime(entry.ended_at)}
          </span>
          <span style={{ color: A }}>
            {fmtDuration(entry.duration_minutes)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 4,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.15s",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => onEdit(entry)}
          style={{
            background: "transparent",
            border: "1px solid rgba(6,182,212,0.2)",
            borderRadius: 4,
            padding: "3px 8px",
            fontFamily: G,
            fontSize: 8,
            letterSpacing: "0.08em",
            color: "rgba(6,182,212,0.5)",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = A;
            (e.currentTarget as HTMLButtonElement).style.borderColor = A;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "rgba(6,182,212,0.5)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "rgba(6,182,212,0.2)";
          }}
        >
          EDIT
        </button>

        {confirmDelete ? (
          <>
            <button
              onClick={() => onDelete(entry.id)}
              disabled={isDeleting}
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.35)",
                borderRadius: 4,
                padding: "3px 8px",
                fontFamily: G,
                fontSize: 8,
                color: "rgba(239,68,68,0.8)",
                cursor: "pointer",
              }}
            >
              {isDeleting ? "…" : "DELETE?"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 4,
                padding: "3px 8px",
                fontFamily: G,
                fontSize: 8,
                color: "rgba(255,255,255,0.25)",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              background: "transparent",
              border: "1px solid rgba(239,68,68,0.12)",
              borderRadius: 4,
              padding: "3px 8px",
              fontFamily: G,
              fontSize: 8,
              letterSpacing: "0.08em",
              color: "rgba(239,68,68,0.3)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "rgba(239,68,68,0.7)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(239,68,68,0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "rgba(239,68,68,0.3)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(239,68,68,0.12)";
            }}
          >
            DELETE
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function BucketEntriesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const bucketId = Number(id);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 350);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editEntry, setEditEntry] = useState<TimeActivity | null>(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  // Reset to page 1 whenever search changes
  const prevSearch = useRef(search);
  useEffect(() => {
    if (search !== prevSearch.current) {
      setPage(1);
      prevSearch.current = search;
    }
  }, [search]);

  const { data, isLoading, isFetching } = useGetBucketEntries(
    bucketId,
    page,
    search,
    PAGE_SIZE,
  );
  const { data: bucketsData } = useGetTimeBuckets();
  const deleteMut = useMutationDeleteTimeEntry();

  const allBuckets = bucketsData?.buckets ?? [];
  const bucket = allBuckets.find((b) => b.id === bucketId);

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;

  const allOnPageSelected =
    entries.length > 0 && entries.every((e) => selected.has(e.id));

  function toggleSelectAll() {
    if (allOnPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const e of entries) next.delete(e.id);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const e of entries) next.add(e.id);
        return next;
      });
    }
  }

  const handleSelect = useCallback((entryId: number, val: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (val) next.add(entryId);
      else next.delete(entryId);
      return next;
    });
  }, []);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["/api/time-entry", bucketId] });
  }

  function handleDelete(entryId: number) {
    deleteMut.mutate(entryId, { onSuccess: invalidate });
  }

  function handleBulkDone() {
    setShowBulkEdit(false);
    setSelected(new Set());
    invalidate();
  }

  const selectedEntries = entries.filter((e) => selected.has(e.id));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        .be-shell { display: flex; flex: 1; height: 100%; min-height: 0; background: #020c10; flex-direction: column; overflow: hidden; }
        .be-header { border-bottom: 1px solid rgba(6,182,212,0.09); padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; background: rgba(2,12,16,0.45); backdrop-filter: blur(2px); flex-shrink: 0; flex-wrap: wrap; gap: 10px; }
        .be-body { flex: 1; overflow-y: auto; padding: 22px 24px; display: flex; flex-direction: column; gap: 16px; }
        .be-body::-webkit-scrollbar { width: 4px; }
        .be-body::-webkit-scrollbar-track { background: transparent; }
        .be-body::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.18); border-radius: 2px; }
        .be-table { border: 1px solid rgba(6,182,212,0.1); border-radius: 8px; overflow: hidden; }
      `}</style>

      <div className="be-shell">
        {/* Header */}
        <div className="be-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: "transparent",
                border: "1px solid rgba(6,182,212,0.15)",
                borderRadius: 4,
                padding: "4px 10px",
                fontFamily: G,
                fontSize: 9,
                letterSpacing: "0.08em",
                color: "rgba(6,182,212,0.5)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = A;
                (e.currentTarget as HTMLButtonElement).style.borderColor = A;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color =
                  "rgba(6,182,212,0.5)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(6,182,212,0.15)";
              }}
            >
              ←
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {bucket && (
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: bucket.color,
                    boxShadow: `0 0 8px ${bucket.color}88`,
                  }}
                />
              )}
              <div>
                <div
                  style={{
                    fontFamily: G,
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {bucket?.name ?? "BUCKET"}
                </div>
                <div
                  style={{
                    fontFamily: G,
                    fontSize: 8,
                    letterSpacing: "0.1em",
                    color: "rgba(6,182,212,0.4)",
                    marginTop: 1,
                  }}
                >
                  {total} {total === 1 ? "entry" : "entries"}
                  {isFetching && !isLoading && (
                    <span style={{ marginLeft: 6, opacity: 0.5 }}>↻</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: G,
                  fontSize: 11,
                  color: "rgba(6,182,212,0.35)",
                  pointerEvents: "none",
                }}
              >
                ⌕
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search descriptions…"
                style={
                  {
                    background: "rgba(6,182,212,0.05)",
                    border: "1px solid rgba(6,182,212,0.18)",
                    borderRadius: 4,
                    padding: "5px 10px 5px 26px",
                    fontFamily: G,
                    fontSize: 10,
                    color: "#fff",
                    outline: "none",
                    width: 200,
                  } as React.CSSProperties
                }
                onFocus={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor = A;
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor =
                    "rgba(6,182,212,0.18)";
                }}
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  style={{
                    position: "absolute",
                    right: 7,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "rgba(6,182,212,0.4)",
                    cursor: "pointer",
                    fontSize: 11,
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {selected.size > 0 && (
              <button
                onClick={() => setShowBulkEdit(true)}
                style={{
                  padding: "5px 12px",
                  background: "rgba(6,182,212,0.1)",
                  border: "1px solid rgba(6,182,212,0.3)",
                  borderRadius: 4,
                  fontFamily: G,
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                  color: A,
                  cursor: "pointer",
                }}
              >
                BULK EDIT ({selected.size})
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="be-body">
          {isLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "64px 0",
              }}
            >
              <div
                style={{
                  fontFamily: G,
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  color: "rgba(6,182,212,0.4)",
                }}
              >
                LOADING…
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div
              style={{
                border: "1px solid rgba(6,182,212,0.08)",
                borderRadius: 8,
                padding: "56px 0",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.15 }}>
                ◎
              </div>
              <div
                style={{
                  fontFamily: G,
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  color: "rgba(6,182,212,0.35)",
                  fontWeight: 700,
                }}
              >
                {search ? "NO RESULTS" : "NO ENTRIES"}
              </div>
              <div
                style={{
                  fontFamily: G,
                  fontSize: 9,
                  color: "rgba(255,255,255,0.18)",
                  marginTop: 8,
                }}
              >
                {search
                  ? `No entries match "${search}".`
                  : "No time logged in this bucket."}
              </div>
            </div>
          ) : (
            <>
              <div className="be-table">
                {/* Table header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "28px 1fr auto",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 14px",
                    background: "rgba(6,182,212,0.04)",
                    borderBottom: "1px solid rgba(6,182,212,0.1)",
                  }}
                >
                  <div
                    onClick={toggleSelectAll}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      border: `1px solid ${allOnPageSelected ? A : "rgba(6,182,212,0.25)"}`,
                      background: allOnPageSelected ? A : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    {allOnPageSelected && (
                      <span
                        style={{ color: "#000", fontSize: 9, lineHeight: 1 }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: G,
                      fontSize: 8,
                      letterSpacing: "0.15em",
                      color: "rgba(6,182,212,0.45)",
                    }}
                  >
                    ENTRY
                    {selected.size > 0 && (
                      <span style={{ marginLeft: 10, color: A }}>
                        {selected.size} selected
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: G,
                      fontSize: 8,
                      letterSpacing: "0.1em",
                      color: "rgba(6,182,212,0.3)",
                      minWidth: 120,
                    }}
                  >
                    ACTIONS
                  </div>
                </div>

                {entries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    selected={selected.has(entry.id)}
                    onSelect={handleSelect}
                    onEdit={setEditEntry}
                    onDelete={handleDelete}
                    isDeleting={deleteMut.isPending}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(6,182,212,0.15)",
                      borderRadius: 4,
                      padding: "4px 12px",
                      fontFamily: G,
                      fontSize: 9,
                      letterSpacing: "0.08em",
                      color:
                        page === 1
                          ? "rgba(6,182,212,0.2)"
                          : "rgba(6,182,212,0.5)",
                      cursor: page === 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    ← PREV
                  </button>
                  <span
                    style={{
                      fontFamily: G,
                      fontSize: 9,
                      color: "rgba(6,182,212,0.4)",
                    }}
                  >
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(6,182,212,0.15)",
                      borderRadius: 4,
                      padding: "4px 12px",
                      fontFamily: G,
                      fontSize: 9,
                      letterSpacing: "0.08em",
                      color:
                        page === totalPages
                          ? "rgba(6,182,212,0.2)"
                          : "rgba(6,182,212,0.5)",
                      cursor: page === totalPages ? "not-allowed" : "pointer",
                    }}
                  >
                    NEXT →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {editEntry && (
        <LogTimeModal
          entry={editEntry}
          buckets={allBuckets}
          onClose={() => {
            setEditEntry(null);
            invalidate();
          }}
        />
      )}

      {showBulkEdit && (
        <BulkEditModal
          entries={selectedEntries}
          buckets={allBuckets}
          onClose={() => setShowBulkEdit(false)}
          onDone={handleBulkDone}
        />
      )}
    </>
  );
}

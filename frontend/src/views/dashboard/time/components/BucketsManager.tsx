import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useMutationCreateTimeBucket,
  useMutationUpdateTimeBucket,
  useMutationDeleteTimeBucket,
  type CreateTimeBucketInput,
} from "@/api/mutations";
import { useGetTimeBuckets, useGetQuestsDashboard } from "@/api/cachedQueries";
import type { TimeBucketItem } from "@/schemas";

const G = "'JetBrains Mono','Fira Code',monospace";
const A = "#06b6d4";

function today() {
  return new Date().toISOString().split("T")[0];
}
function yearAgo() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().split("T")[0];
}

const SWATCHES = [
  "#06b6d4","#8b5cf6","#ec4899","#ef4444","#f97316",
  "#eab308","#22c55e","#10b981","#3b82f6","#6b7280",
];

// ── Inline bucket form (shared by create + edit) ────────────────────────────

interface BucketFormProps {
  initial?: { name: string; color: string; is_distraction: boolean; quest_id: string | null };
  questNames: Record<string, string>;
  onSubmit: (vals: { name: string; color: string; is_distraction: boolean; quest_id: string | null }) => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}

function BucketForm({ initial, questNames, onSubmit, onCancel, isPending, submitLabel }: BucketFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? SWATCHES[0]);
  const [isDistraction, setIsDistraction] = useState(initial?.is_distraction ?? false);
  const [questId, setQuestId] = useState<string | null>(initial?.quest_id ?? null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), color, is_distraction: isDistraction, quest_id: questId });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "rgba(6,182,212,0.04)",
        border: "1px solid rgba(6,182,212,0.15)",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Name */}
      <div>
        <label style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.15em", color: "rgba(6,182,212,0.5)", display: "block", marginBottom: 5 }}>
          BUCKET NAME
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Deep Work"
          required
          style={{
            width: "100%",
            background: "rgba(6,182,212,0.05)",
            border: "1px solid rgba(6,182,212,0.2)",
            borderRadius: 5,
            padding: "7px 10px",
            fontFamily: G,
            fontSize: 12,
            color: "#fff",
            outline: "none",
            boxSizing: "border-box",
          } as React.CSSProperties}
          onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = A; }}
          onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(6,182,212,0.2)"; }}
        />
      </div>

      {/* Color */}
      <div>
        <label style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.15em", color: "rgba(6,182,212,0.5)", display: "block", marginBottom: 7 }}>
          COLOR
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: c,
                border: color === c ? `2px solid #fff` : "2px solid transparent",
                cursor: "pointer",
                outline: color === c ? `2px solid ${c}` : "none",
                outlineOffset: 2,
                transition: "transform 0.1s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.15)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            />
          ))}
        </div>
      </div>

      {/* Options row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <div
            onClick={() => setIsDistraction(!isDistraction)}
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              border: `1px solid ${isDistraction ? "rgba(239,68,68,0.7)" : "rgba(6,182,212,0.25)"}`,
              background: isDistraction ? "rgba(239,68,68,0.2)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.12s",
            }}
          >
            {isDistraction && (
              <span style={{ color: "rgba(239,68,68,0.85)", fontSize: 9, lineHeight: 1 }}>✓</span>
            )}
          </div>
          <span style={{ fontFamily: G, fontSize: 9, color: isDistraction ? "rgba(239,68,68,0.75)" : "rgba(255,255,255,0.45)" }}>
            Distraction
          </span>
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: G, fontSize: 8, color: "rgba(6,182,212,0.4)" }}>QUEST</span>
          <select
            value={questId ?? ""}
            onChange={(e) => setQuestId(e.target.value || null)}
            style={{
              background: "rgba(6,182,212,0.05)",
              border: "1px solid rgba(6,182,212,0.15)",
              borderRadius: 4,
              padding: "3px 8px",
              fontFamily: G,
              fontSize: 9,
              color: "rgba(255,255,255,0.6)",
              outline: "none",
              cursor: "pointer",
            } as React.CSSProperties}
          >
            <option value="" style={{ background: "#030e12" }}>None</option>
            {Object.entries(questNames).map(([id, n]) => (
              <option key={id} value={id} style={{ background: "#030e12" }}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "6px 14px",
            background: "transparent",
            border: "1px solid rgba(6,182,212,0.15)",
            borderRadius: 5,
            fontFamily: G,
            fontSize: 9,
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.35)",
            cursor: "pointer",
          }}
        >
          CANCEL
        </button>
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          style={{
            padding: "6px 16px",
            background: isPending ? "rgba(6,182,212,0.3)" : A,
            border: "none",
            borderRadius: 5,
            fontFamily: G,
            fontSize: 9,
            letterSpacing: "0.1em",
            fontWeight: 700,
            color: "#000",
            cursor: isPending ? "not-allowed" : "pointer",
            boxShadow: isPending ? "none" : "0 0 12px rgba(6,182,212,0.35)",
          }}
        >
          {isPending ? "SAVING…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

// ── Bucket Card ──────────────────────────────────────────────────────────────

interface BucketCardProps {
  bucket: TimeBucketItem;
  questNames: Record<string, string>;
}

function BucketCard({ bucket, questNames }: BucketCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();

  const update = useMutationUpdateTimeBucket(bucket.id);
  const del = useMutationDeleteTimeBucket();

  function handleUpdate(vals: { name: string; color: string; is_distraction: boolean; quest_id: string | null }) {
    update.mutate(
      { name: vals.name, color: vals.color, is_distraction: vals.is_distraction, quest_id: vals.quest_id },
      { onSuccess: () => setEditing(false) },
    );
  }

  function handleArchive() {
    update.mutate({ is_archived: !bucket.is_archived });
  }

  if (editing) {
    return (
      <BucketForm
        initial={{ name: bucket.name, color: bucket.color, is_distraction: bucket.is_distraction, quest_id: bucket.quest_id }}
        questNames={questNames}
        onSubmit={handleUpdate}
        onCancel={() => setEditing(false)}
        isPending={update.isPending}
        submitLabel="SAVE"
      />
    );
  }

  return (
    <div
      style={{
        background: "rgba(6,182,212,0.03)",
        border: `1px solid ${bucket.is_archived ? "rgba(255,255,255,0.06)" : "rgba(6,182,212,0.12)"}`,
        borderRadius: 8,
        overflow: "hidden",
        opacity: bucket.is_archived ? 0.55 : 1,
        transition: "opacity 0.2s",
      }}
    >
      <div
        style={{
          height: 3,
          background: bucket.is_archived ? "rgba(255,255,255,0.1)" : bucket.color,
          boxShadow: bucket.is_archived ? "none" : `0 0 8px ${bucket.color}66`,
        }}
      />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: bucket.color,
              flexShrink: 0,
              marginTop: 2,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              onClick={() => navigate(`/time/bucket/${bucket.id}`)}
              style={{
                fontFamily: G,
                fontSize: 12,
                fontWeight: 700,
                color: bucket.is_archived ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.color = A; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.color = bucket.is_archived ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)"; }}
            >
              {bucket.name}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            {bucket.is_distraction && (
              <span
                style={{
                  fontFamily: G,
                  fontSize: 7,
                  letterSpacing: "0.1em",
                  padding: "2px 5px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 3,
                  color: "rgba(239,68,68,0.65)",
                }}
              >
                DISTRACTION
              </span>
            )}
            {bucket.is_archived && (
              <span
                style={{
                  fontFamily: G,
                  fontSize: 7,
                  letterSpacing: "0.1em",
                  padding: "2px 5px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 3,
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                ARCHIVED
              </span>
            )}
          </div>
        </div>

        {bucket.quest_name && (
          <div
            style={{
              fontFamily: G,
              fontSize: 8,
              color: "rgba(139,92,246,0.55)",
              marginBottom: 10,
              marginLeft: 20,
            }}
          >
            ⚔ {bucket.quest_name}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 5, marginLeft: 20 }}>
          <button
            onClick={() => setEditing(true)}
            style={{
              background: "transparent",
              border: "1px solid rgba(6,182,212,0.15)",
              borderRadius: 4,
              padding: "3px 8px",
              fontFamily: G,
              fontSize: 8,
              letterSpacing: "0.08em",
              color: "rgba(6,182,212,0.45)",
              cursor: "pointer",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = A;
              (e.currentTarget as HTMLButtonElement).style.borderColor = A;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(6,182,212,0.45)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(6,182,212,0.15)";
            }}
          >
            EDIT
          </button>

          <button
            onClick={handleArchive}
            disabled={update.isPending}
            title={bucket.is_archived ? "Unarchive — make active again" : "Archive — hide from dropdowns, preserve logs"}
            style={{
              background: "transparent",
              border: `1px solid ${bucket.is_archived ? "rgba(34,211,153,0.2)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 4,
              padding: "3px 8px",
              fontFamily: G,
              fontSize: 8,
              letterSpacing: "0.08em",
              color: bucket.is_archived ? "rgba(34,211,153,0.55)" : "rgba(255,255,255,0.3)",
              cursor: "pointer",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = bucket.is_archived ? "rgba(34,211,153,0.85)" : "rgba(255,255,255,0.65)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = bucket.is_archived ? "rgba(34,211,153,0.55)" : "rgba(255,255,255,0.3)";
            }}
          >
            {update.isPending ? "…" : bucket.is_archived ? "UNARCHIVE" : "ARCHIVE"}
          </button>

          {confirmDelete ? (
            <>
              <button
                onClick={() => del.mutate(bucket.id)}
                disabled={del.isPending}
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
                {del.isPending ? "…" : "DELETE?"}
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
                CANCEL
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
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(239,68,68,0.7)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(239,68,68,0.3)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.12)";
              }}
            >
              DELETE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function BucketsManager() {
  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const { data: bucketsData } = useGetTimeBuckets();
  const { data: questsData } = useGetQuestsDashboard(yearAgo(), today());

  const questNames: Record<string, string> = {};
  if (questsData?.quests) {
    for (const q of questsData.quests) questNames[q.id] = q.name;
  }

  const create = useMutationCreateTimeBucket();

  const allBuckets = bucketsData?.buckets ?? [];
  const active = allBuckets.filter((b) => !b.is_archived);
  const archived = allBuckets.filter((b) => b.is_archived);

  function handleCreate(vals: { name: string; color: string; is_distraction: boolean; quest_id: string | null }) {
    const input: CreateTimeBucketInput = {
      name: vals.name,
      color: vals.color,
      is_distraction: vals.is_distraction,
      quest_id: vals.quest_id,
    };
    create.mutate(input, { onSuccess: () => setShowCreate(false) });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: G, fontSize: 9, letterSpacing: "0.2em", fontWeight: 700, color: "rgba(6,182,212,0.6)" }}>
            BUCKETS
          </div>
          <div style={{ fontFamily: G, fontSize: 8, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>
            {active.length} active · {archived.length} archived
          </div>
        </div>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              background: A,
              border: "none",
              borderRadius: 5,
              fontFamily: G,
              fontSize: 9,
              letterSpacing: "0.1em",
              fontWeight: 700,
              color: "#000",
              cursor: "pointer",
              boxShadow: "0 0 14px rgba(6,182,212,0.35)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 22px rgba(6,182,212,0.55)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 14px rgba(6,182,212,0.35)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            + NEW BUCKET
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <BucketForm
          questNames={questNames}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          isPending={create.isPending}
          submitLabel="CREATE"
        />
      )}

      {/* Active buckets */}
      {active.length === 0 && !showCreate ? (
        <div
          style={{
            border: "1px solid rgba(6,182,212,0.08)",
            borderRadius: 8,
            padding: "48px 0",
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: G, fontSize: 9, color: "rgba(6,182,212,0.3)", letterSpacing: "0.15em" }}>
            NO ACTIVE BUCKETS
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 10,
          }}
        >
          {active.map((b) => (
            <BucketCard key={b.id} bucket={b} questNames={questNames} />
          ))}
        </div>
      )}

      {/* Archived section */}
      {archived.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              border: "none",
              padding: "6px 0",
              cursor: "pointer",
              marginBottom: 10,
            }}
          >
            <div style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)" }}>
              {showArchived ? "▾" : "▸"} ARCHIVED ({archived.length})
            </div>
          </button>

          {showArchived && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 10,
              }}
            >
              {archived.map((b) => (
                <BucketCard key={b.id} bucket={b} questNames={questNames} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Archive explanation */}
      <div
        style={{
          background: "rgba(6,182,212,0.03)",
          border: "1px solid rgba(6,182,212,0.08)",
          borderRadius: 6,
          padding: "10px 14px",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <span style={{ color: "rgba(6,182,212,0.4)", fontSize: 12, lineHeight: 1.4 }}>ⓘ</span>
        <div style={{ fontFamily: G, fontSize: 9, color: "rgba(255,255,255,0.25)", lineHeight: 1.7 }}>
          <span style={{ color: "rgba(6,182,212,0.5)", fontWeight: 700 }}>Archive</span>{" "}
          hides a bucket from entry dropdowns while preserving all historical logs.
          Use it when a project is no longer active.{" "}
          <span style={{ color: "rgba(239,68,68,0.5)", fontWeight: 700 }}>Delete</span>{" "}
          permanently removes the bucket and all its entries.
        </div>
      </div>
    </div>
  );
}

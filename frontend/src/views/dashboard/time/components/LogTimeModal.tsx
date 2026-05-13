import { useState, useEffect } from "react";
import type { TimeActivity, TimeBucketItem } from "@/schemas";
import {
  useMutationCreateTimeEntry,
  useMutationUpdateTimeEntry,
} from "@/api/mutations";

const G = "'JetBrains Mono','Fira Code',monospace";
const A = "#06b6d4";

function today() {
  return new Date().toISOString().split("T")[0];
}

function calcDuration(startDate: string, startTime: string, endDate: string, endTime: string): string {
  if (!startDate || !startTime || !endDate || !endTime) return "—";
  const start = new Date(`${startDate}T${startTime}:00`).getTime();
  const end = new Date(`${endDate}T${endTime}:00`).getTime();
  const mins = Math.round((end - start) / 60000);
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

interface Props {
  entry?: TimeActivity | null;
  buckets: TimeBucketItem[];
  defaultDate?: string;
  onClose: () => void;
}

export default function LogTimeModal({ entry, buckets, defaultDate, onClose }: Props) {
  const isEdit = !!entry;
  const activeBuckets = buckets.filter((b) => !b.is_archived);

  const [startDate, setStartDate] = useState(
    entry ? entry.started_at.slice(0, 10) : (defaultDate ?? today()),
  );
  const [endDate, setEndDate] = useState(
    entry ? entry.ended_at.slice(0, 10) : (defaultDate ?? today()),
  );
  const [bucketId, setBucketId] = useState<string>(
    entry ? String(entry.bucket_id) : (activeBuckets[0]?.id ? String(activeBuckets[0].id) : ""),
  );
  const [activity, setActivity] = useState(entry?.activity ?? "");
  const [startTime, setStartTime] = useState(entry ? entry.started_at.slice(11, 16) : "");
  const [endTime, setEndTime] = useState(entry ? entry.ended_at.slice(11, 16) : "");
  const [error, setError] = useState("");

  const createMut = useMutationCreateTimeEntry();
  const updateMut = useMutationUpdateTimeEntry(entry?.id ?? 0);

  const isPending = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!bucketId) return setError("Select a bucket.");
    if (!activity.trim()) return setError("Activity description is required.");
    if (!startTime) return setError("Start time is required.");
    if (!endTime) return setError("End time is required.");

    const started_at = `${startDate}T${startTime}:00`;
    const ended_at = `${endDate}T${endTime}:00`;

    if (new Date(ended_at) <= new Date(started_at)) return setError("End must be after start.");

    if (isEdit) {
      updateMut.mutate(
        { bucket_id: Number(bucketId), activity: activity.trim(), started_at, ended_at },
        { onSuccess: () => onClose(), onError: () => setError("Failed to update entry.") },
      );
    } else {
      createMut.mutate(
        { bucket_id: Number(bucketId), activity: activity.trim(), started_at, ended_at },
        { onSuccess: () => onClose(), onError: () => setError("Failed to create entry.") },
      );
    }
  }

  const selectedBucket = activeBuckets.find((b) => String(b.id) === bucketId);
  const duration = calcDuration(startDate, startTime, endDate, endTime);

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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#030e12",
          border: "1px solid rgba(6,182,212,0.2)",
          borderRadius: 10,
          width: "100%",
          maxWidth: 460,
          boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(6,182,212,0.06)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
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
            <div style={{ fontFamily: G, fontSize: 11, letterSpacing: "0.2em", fontWeight: 700, color: "#fff" }}>
              {isEdit ? "EDIT ENTRY" : "LOG TIME"}
            </div>
            <div style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.12em", color: "rgba(6,182,212,0.45)", marginTop: 2 }}>
              {isEdit ? "modify time entry" : "record a new session"}
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
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = A; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(6,182,212,0.4)"; }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Start date + End date + Duration */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 10 }}>
            <div>
              <label style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.15em", color: "rgba(6,182,212,0.5)", display: "block", marginBottom: 5 }}>
                START DATE
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
                required
                style={{
                  width: "100%",
                  background: "rgba(6,182,212,0.05)",
                  border: "1px solid rgba(6,182,212,0.2)",
                  borderRadius: 5,
                  padding: "7px 10px",
                  fontFamily: G,
                  fontSize: 11,
                  color: "#fff",
                  outline: "none",
                  colorScheme: "dark",
                } as React.CSSProperties}
                onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = A; }}
                onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(6,182,212,0.2)"; }}
              />
            </div>
            <div>
              <label style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.15em", color: "rgba(6,182,212,0.5)", display: "block", marginBottom: 5 }}>
                END DATE
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                style={{
                  width: "100%",
                  background: "rgba(6,182,212,0.05)",
                  border: "1px solid rgba(6,182,212,0.2)",
                  borderRadius: 5,
                  padding: "7px 10px",
                  fontFamily: G,
                  fontSize: 11,
                  color: "#fff",
                  outline: "none",
                  colorScheme: "dark",
                } as React.CSSProperties}
                onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = A; }}
                onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(6,182,212,0.2)"; }}
              />
            </div>
            <div>
              <label style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.15em", color: "rgba(6,182,212,0.5)", display: "block", marginBottom: 5 }}>
                DURATION
              </label>
              <div
                style={{
                  background: "rgba(6,182,212,0.04)",
                  border: "1px solid rgba(6,182,212,0.1)",
                  borderRadius: 5,
                  padding: "7px 10px",
                  fontFamily: G,
                  fontSize: 13,
                  fontWeight: 700,
                  color: duration === "—" ? "rgba(255,255,255,0.2)" : A,
                  textShadow: duration !== "—" ? `0 0 12px rgba(6,182,212,0.3)` : "none",
                }}
              >
                {duration}
              </div>
            </div>
          </div>

          {/* Bucket */}
          <div>
            <label style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.15em", color: "rgba(6,182,212,0.5)", display: "block", marginBottom: 5 }}>
              BUCKET
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
                value={bucketId}
                onChange={(e) => setBucketId(e.target.value)}
                required
                style={{
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
                } as React.CSSProperties}
                onFocus={(e) => { (e.currentTarget as HTMLSelectElement).style.borderColor = A; }}
                onBlur={(e) => { (e.currentTarget as HTMLSelectElement).style.borderColor = "rgba(6,182,212,0.2)"; }}
              >
                <option value="" style={{ background: "#030e12" }}>Select bucket…</option>
                {activeBuckets.map((b) => (
                  <option key={b.id} value={String(b.id)} style={{ background: "#030e12" }}>
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

          {/* Activity */}
          <div>
            <label style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.15em", color: "rgba(6,182,212,0.5)", display: "block", marginBottom: 5 }}>
              ACTIVITY
            </label>
            <input
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="What were you working on?"
              required
              style={{
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
              } as React.CSSProperties}
              onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = A; }}
              onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(6,182,212,0.2)"; }}
            />
          </div>

          {/* Time range */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center" }}>
            <div>
              <label style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.15em", color: "rgba(6,182,212,0.5)", display: "block", marginBottom: 5 }}>
                START
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
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
                  colorScheme: "dark",
                } as React.CSSProperties}
                onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = A; }}
                onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(6,182,212,0.2)"; }}
              />
            </div>
            <div style={{ fontFamily: G, fontSize: 10, color: "rgba(6,182,212,0.3)", paddingTop: 18 }}>→</div>
            <div>
              <label style={{ fontFamily: G, fontSize: 8, letterSpacing: "0.15em", color: "rgba(6,182,212,0.5)", display: "block", marginBottom: 5 }}>
                END
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
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
                  colorScheme: "dark",
                } as React.CSSProperties}
                onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = A; }}
                onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(6,182,212,0.2)"; }}
              />
            </div>
          </div>

          {/* Error */}
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

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
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
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)"; }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: "7px 18px",
                background: isPending ? "rgba(6,182,212,0.3)" : A,
                border: "none",
                borderRadius: 5,
                fontFamily: G,
                fontSize: 10,
                letterSpacing: "0.1em",
                fontWeight: 700,
                color: isPending ? "rgba(255,255,255,0.5)" : "#000",
                cursor: isPending ? "not-allowed" : "pointer",
                boxShadow: isPending ? "none" : "0 0 16px rgba(6,182,212,0.4)",
                transition: "all 0.15s",
              }}
            >
              {isPending ? "SAVING…" : isEdit ? "UPDATE" : "LOG TIME"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

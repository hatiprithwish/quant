import { useState } from "react";
import type { DayTimeSummary, TimeActivity } from "@/schemas";
import { useMutationDeleteTimeEntry } from "@/api/mutations";

const G = "'JetBrains Mono','Fira Code',monospace";
const A = "#06b6d4";

function fmtMins(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return { day: `${d} ${months[Number(m) - 1]}`, weekday: weekdays[date.getDay()] };
}

interface Props {
  days: DayTimeSummary[];
  onEdit: (entry: TimeActivity) => void;
}

function ActivityRow({ activity, onEdit }: { activity: TimeActivity; onEdit: (a: TimeActivity) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const del = useMutationDeleteTimeEntry();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 16px",
        borderTop: "1px solid rgba(6,182,212,0.06)",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(6,182,212,0.03)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: activity.bucket_color,
          flexShrink: 0,
          boxShadow: `0 0 5px ${activity.bucket_color}66`,
        }}
      />
      <div
        style={{
          fontFamily: G,
          fontSize: 8,
          letterSpacing: "0.08em",
          color: activity.bucket_color,
          opacity: 0.8,
          flexShrink: 0,
          maxWidth: 80,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {activity.bucket_name}
      </div>
      <div
        style={{
          flex: 1,
          fontFamily: G,
          fontSize: 11,
          color: "rgba(255,255,255,0.75)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {activity.activity}
      </div>
      <div
        style={{
          fontFamily: G,
          fontSize: 9,
          color: "rgba(6,182,212,0.35)",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        {activity.start_time.slice(11, 16)} – {activity.end_time.slice(11, 16)}
      </div>
      <div
        style={{
          fontFamily: G,
          fontSize: 9,
          fontWeight: 700,
          color: "rgba(255,255,255,0.45)",
          width: 44,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {fmtMins(activity.duration_minutes)}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button
          onClick={() => onEdit(activity)}
          title="Edit"
          style={{
            background: "none",
            border: "1px solid rgba(6,182,212,0.15)",
            borderRadius: 3,
            padding: "2px 6px",
            fontFamily: G,
            fontSize: 9,
            color: "rgba(6,182,212,0.4)",
            cursor: "pointer",
            transition: "all 0.12s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = A;
            (e.currentTarget as HTMLButtonElement).style.borderColor = A;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(6,182,212,0.4)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(6,182,212,0.15)";
          }}
        >
          ✎
        </button>

        {confirmDelete ? (
          <div style={{ display: "flex", gap: 3 }}>
            <button
              onClick={() => del.mutate(activity.id, { onSuccess: () => setConfirmDelete(false) })}
              disabled={del.isPending}
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: 3,
                padding: "2px 6px",
                fontFamily: G,
                fontSize: 8,
                color: "rgba(239,68,68,0.85)",
                cursor: "pointer",
              }}
            >
              {del.isPending ? "…" : "YES"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 3,
                padding: "2px 6px",
                fontFamily: G,
                fontSize: 8,
                color: "rgba(255,255,255,0.3)",
                cursor: "pointer",
              }}
            >
              NO
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            title="Delete"
            style={{
              background: "none",
              border: "1px solid rgba(239,68,68,0.15)",
              borderRadius: 3,
              padding: "2px 6px",
              fontFamily: G,
              fontSize: 9,
              color: "rgba(239,68,68,0.35)",
              cursor: "pointer",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(239,68,68,0.85)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(239,68,68,0.35)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.15)";
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

interface DayGroupProps {
  day: DayTimeSummary;
  onEdit: (a: TimeActivity) => void;
}

function DayGroup({ day, onEdit }: DayGroupProps) {
  const { day: dayLabel, weekday } = fmtDate(day.date);
  const allActivities = day.buckets.flatMap((b) => b.activities);
  const sorted = [...allActivities].sort((a, b) => a.start_time.localeCompare(b.start_time));

  if (sorted.length === 0) return null;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 16px",
          background: "rgba(6,182,212,0.04)",
          borderTop: "1px solid rgba(6,182,212,0.08)",
        }}
      >
        <div style={{ fontFamily: G, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: A }}>
          {dayLabel}
        </div>
        <div style={{ fontFamily: G, fontSize: 8, color: "rgba(6,182,212,0.35)" }}>
          {weekday}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: G, fontSize: 8, color: "rgba(6,182,212,0.35)" }}>
          {fmtMins(day.total_minutes)}
        </div>
      </div>
      {sorted.map((a) => (
        <ActivityRow key={a.id} activity={a} onEdit={onEdit} />
      ))}
    </div>
  );
}

interface Props {
  days: DayTimeSummary[];
  onEdit: (entry: TimeActivity) => void;
}

export default function ActivityLog({ days, onEdit }: Props) {
  const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return (
      <div
        style={{
          border: "1px solid rgba(6,182,212,0.1)",
          borderRadius: 8,
          padding: "56px 0",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.2 }}>◎</div>
        <div style={{ fontFamily: G, fontSize: 10, letterSpacing: "0.18em", color: "rgba(6,182,212,0.35)", fontWeight: 700 }}>
          NO ENTRIES
        </div>
        <div style={{ fontFamily: G, fontSize: 9, color: "rgba(255,255,255,0.18)", marginTop: 6 }}>
          Log your first time entry to get started.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid rgba(6,182,212,0.12)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 16px",
          borderBottom: "1px solid rgba(6,182,212,0.1)",
          background: "rgba(6,182,212,0.04)",
        }}
      >
        <div style={{ fontFamily: G, fontSize: 9, letterSpacing: "0.18em", fontWeight: 700, color: "rgba(6,182,212,0.6)" }}>
          ACTIVITY LOG
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: G, fontSize: 8, color: "rgba(6,182,212,0.3)", display: "flex", gap: 12 }}>
          <span>BUCKET</span>
          <span>TIME</span>
          <span>DURATION</span>
        </div>
      </div>
      {sorted.map((day) => (
        <DayGroup key={day.date} day={day} onEdit={onEdit} />
      ))}
    </div>
  );
}

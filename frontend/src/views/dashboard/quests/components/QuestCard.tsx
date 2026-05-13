import { useNavigate } from "react-router-dom";
import type { QuestSummary } from "@/schemas";
import { questCategoryIcon, QuestStatusEnum } from "@/schemas";

function fmtMins(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function ProgressRing({ pct, color, size = 44 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(139,92,246,0.12)" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 3px ${color})`, transition: "stroke-dashoffset 0.4s ease" }}
      />
      <text
        x={size / 2} y={size / 2 + 4}
        textAnchor="middle" fontSize={8} fontWeight={700} fill={color}
        style={{ fontFamily: "'JetBrains Mono',monospace" }}
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

const STATUS_BADGE: Record<QuestStatusEnum, { bg: string; color: string; label: string }> = {
  [QuestStatusEnum.Active]: { bg: "rgba(16,185,129,0.12)", color: "#10b981", label: "ACTIVE" },
  [QuestStatusEnum.Paused]: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "PAUSED" },
  [QuestStatusEnum.Blocked]: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", label: "BLOCKED" },
  [QuestStatusEnum.Done]: { bg: "rgba(139,92,246,0.08)", color: "rgba(167,139,250,0.45)", label: "DONE" },
};

interface Props {
  quest: QuestSummary;
}

export default function QuestCard({ quest }: Props) {
  const navigate = useNavigate();
  const taskPct = quest.task_total > 0 ? (quest.task_done / quest.task_total) * 100 : 0;
  const xpPct = quest.xp_max > 0 ? Math.min((quest.total_xp / quest.xp_max) * 100, 100) : 0;
  const badge = STATUS_BADGE[quest.status];

  return (
    <div
      onClick={() => navigate(`/quests/${quest.id}`)}
      style={{
        background: "rgba(14,9,26,0.9)",
        border: "1px solid rgba(139,92,246,0.14)",
        borderRadius: 8,
        padding: 16,
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "rgba(139,92,246,0.35)";
        el.style.boxShadow = "0 0 22px rgba(139,92,246,0.12)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "rgba(139,92,246,0.14)";
        el.style.boxShadow = "none";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Top color accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: quest.color,
        boxShadow: `0 0 10px ${quest.color}`,
      }} />

      {/* Row 1: category · status badge · progress ring */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        marginTop: 4, marginBottom: 8,
      }}>
        <span style={{
          fontSize: 9, color: quest.color, opacity: 0.85,
          textShadow: `0 0 6px ${quest.color}`,
        }}>{questCategoryIcon[quest.category]}</span>
        <span style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 7, letterSpacing: "0.15em",
          color: "rgba(167,139,250,0.35)",
          textTransform: "uppercase",
        }}>{quest.category}</span>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 7, letterSpacing: "0.1em", fontWeight: 700,
            padding: "2px 5px", borderRadius: 2,
            background: badge.bg, color: badge.color,
          }}>{badge.label}</span>
          <ProgressRing pct={taskPct} color={quest.color} />
        </div>
      </div>

      {/* Quest name — full width */}
      <div style={{
        fontSize: 14, fontWeight: 600,
        color: "#ddd6fe",
        marginBottom: 12,
        lineHeight: 1.35,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>{quest.name}</div>

      {/* XP bar — full width */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 7, letterSpacing: "0.12em",
            color: "rgba(139,92,246,0.38)",
          }}>XP</span>
          <span style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 7, color: "#fbbf24", opacity: 0.8,
          }}>{quest.total_xp} / {quest.xp_max}</span>
        </div>
        <div style={{
          height: 3,
          background: "rgba(139,92,246,0.1)",
          borderRadius: 2, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", width: `${xpPct}%`,
            background: `linear-gradient(90deg, ${quest.color}bb, ${quest.color})`,
            boxShadow: `0 0 5px ${quest.color}`,
            borderRadius: 2, transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* Streak / time — full width */}
      {(quest.streak > 0 || quest.time_this_week_minutes > 0) && (
        <div style={{ display: "flex", gap: 10, marginBottom: 9, alignItems: "center" }}>
          {quest.streak > 0 && (
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#fbbf24" }}>
              🔥 {quest.streak}d
            </span>
          )}
          {quest.time_this_week_minutes > 0 && (
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "rgba(139,92,246,0.38)" }}>
              {fmtMins(quest.time_this_week_minutes)} this wk
            </span>
          )}
        </div>
      )}

      {/* Next milestone — full width */}
      {quest.next_milestone && (
        <div style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 7, color: "rgba(167,139,250,0.38)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          marginBottom: 10,
        }}>
          <span style={{ color: "rgba(139,92,246,0.25)" }}>NEXT · </span>
          {quest.next_milestone}
          {quest.next_milestone_due && (
            <span style={{ color: "rgba(139,92,246,0.2)" }}> · {quest.next_milestone_due}</span>
          )}
        </div>
      )}

      {/* Footer — full width */}
      <div style={{
        borderTop: "1px solid rgba(139,92,246,0.07)",
        paddingTop: 9, marginTop: "auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 7, color: "rgba(167,139,250,0.3)", letterSpacing: "0.06em",
        }}>{quest.task_done}/{quest.task_total} tasks</span>
        <span style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 7, color: "rgba(167,139,250,0.3)", letterSpacing: "0.06em",
        }}>{quest.milestone_done}/{quest.milestone_total} milestones</span>
      </div>
    </div>
  );
}

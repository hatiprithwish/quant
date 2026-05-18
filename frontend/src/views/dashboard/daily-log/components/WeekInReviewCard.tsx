import { Link } from "react-router-dom";
import { useGetWeeklyCheckin } from "@/api/cachedQueries";

const MONO = "'JetBrains Mono','Fira Code','Courier New',monospace";

function getMondayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

interface WeekInReviewCardProps {
  weekStart: string;
  isCurrentWeek: boolean;
}

export default function WeekInReviewCard({ weekStart, isCurrentWeek }: WeekInReviewCardProps) {
  const monday = getMondayOf(weekStart);
  const { data, isLoading } = useGetWeeklyCheckin(monday);
  const checkin = data?.checkin;
  const analysis = data?.analysis;

  const score = checkin?.weekly_score ?? null;
  const status = checkin?.status ?? (isCurrentWeek ? "pending" : null);
  const scoreColor = score === null ? "rgba(255,255,255,0.3)" : score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";
  const scoreRgb = score === null ? "255,255,255" : score >= 70 ? "34,197,94" : score >= 40 ? "234,179,8" : "239,68,68";

  const components = analysis
    ? [
        { label: "TASKS", value: Math.round(analysis.task_completion.score), color: "#a78bfa" },
        { label: "ELIM", value: Math.round(analysis.elimination.score), color: "#22c55e" },
        { label: "DECISIONS", value: Math.round(analysis.decision_alignment.score), color: "#06b6d4" },
        { label: "CONFIDENCE", value: Math.round(analysis.confidence.score), color: "#eab308" },
      ]
    : [
        { label: "TASKS", value: checkin?.task_completion_score ?? 0, color: "#a78bfa" },
        { label: "ELIM", value: checkin?.elimination_score ?? 0, color: "#22c55e" },
        { label: "DECISIONS", value: checkin?.decision_alignment_score ?? 0, color: "#06b6d4" },
        { label: "CONFIDENCE", value: checkin?.confidence_score ?? 0, color: "#eab308" },
      ];

  if (isLoading) {
    return (
      <div style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 8, marginBottom: 12, padding: "10px 14px", fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.25)" }}>
        Loading week in review…
      </div>
    );
  }

  if (!checkin) {
    if (!isCurrentWeek) return null;
    return (
      <div style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 8, marginBottom: 12, padding: "10px 14px", fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
        No review available for this week yet.
      </div>
    );
  }

  return (
    <div style={{ background: `rgba(${scoreRgb},0.04)`, border: `1px solid rgba(${scoreRgb},0.18)`, borderRadius: 8, marginBottom: 12, overflow: "hidden", fontFamily: MONO }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px" }}>
        <span style={{ fontSize: 10, color: scoreColor }}>△</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 9, letterSpacing: "0.14em", fontWeight: 700, color: scoreColor }}>WEEK IN REVIEW</span>
          {" "}
          <span style={{ fontSize: 7, color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em" }}>{monday}</span>
        </div>
        {status === "pending" && isCurrentWeek && (
          <span style={{ fontSize: 7, letterSpacing: "0.1em", color: "#eab308", background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)", padding: "1px 6px", borderRadius: 2 }}>
            AWAITING REVIEW
          </span>
        )}
        {score !== null && status === "reviewed" && (
          <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor }}>{Math.round(score)}</span>
        )}
      </div>

      {/* Expanded body always shown */}
      <div style={{ padding: "0 14px 12px", borderTop: `1px solid rgba(${scoreRgb},0.1)`, paddingTop: 10 }}>
        {/* Score + component bars */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {score !== null ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{Math.round(score)}</div>
              <div style={{ fontSize: 6, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", marginTop: 2 }}>SCORE</div>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.2)", lineHeight: 1 }}>—</div>
              <div style={{ fontSize: 6, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", marginTop: 2 }}>PENDING</div>
            </div>
          )}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
            {components.map((c) => (
              <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.3)", width: 64, flexShrink: 0 }}>{c.label}</span>
                <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${Math.max(0, Math.min(100, c.value))}%`, height: "100%", background: c.color, borderRadius: 2, boxShadow: `0 0 5px ${c.color}60` }} />
                </div>
                <span style={{ fontFamily: MONO, fontSize: 8, color: c.color, fontWeight: 700, width: 22, textAlign: "right" }}>{c.value || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI narrative snippet */}
        {analysis?.narrative && (
          <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, borderTop: `1px solid rgba(${scoreRgb},0.08)`, paddingTop: 8 }}>
            {analysis.narrative.slice(0, 160)}{analysis.narrative.length > 160 ? "…" : ""}
          </div>
        )}
        {!analysis && isCurrentWeek && (
          <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.3)", lineHeight: 1.6, borderTop: `1px solid rgba(${scoreRgb},0.08)`, paddingTop: 8 }}>
            AI analysis will be ready Sunday night — check back then to lock in your week.
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
          <Link
            to="/quests/checkin"
            style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.12em", fontWeight: 700, padding: "4px 12px", borderRadius: 3, background: isCurrentWeek && status !== "reviewed" ? "#7c3aed" : `rgba(${scoreRgb},0.08)`, border: isCurrentWeek && status !== "reviewed" ? "none" : `1px solid rgba(${scoreRgb},0.2)`, color: isCurrentWeek && status !== "reviewed" ? "#fff" : scoreColor, textDecoration: "none", boxShadow: isCurrentWeek && status !== "reviewed" ? "0 0 12px rgba(124,58,237,0.4)" : "none" }}
          >
            {isCurrentWeek && status !== "reviewed" ? "✓ REVIEW & LOCK IN →" : "VIEW REVIEW →"}
          </Link>
        </div>
      </div>
    </div>
  );
}

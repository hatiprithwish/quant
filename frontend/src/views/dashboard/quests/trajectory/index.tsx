import { useGetTrajectoryDashboard } from "@/api/cachedQueries";
import Spinner from "@/components/common/Spinner";

const MONO = "'JetBrains Mono','Fira Code','Courier New',monospace";

function ScoreRing({ score, label, size = 140 }: { score: number; label: string; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";
  const glow = score >= 70 ? "rgba(34,197,94,0.4)" : score >= 40 ? "rgba(234,179,8,0.4)" : "rgba(239,68,68,0.4)";

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontFamily: MONO, fontSize: 7, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{label}</span>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max, color, colorRgb }: { label: string; value: number; max: number; color: string; colorRgb: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>{label}</span>
        <span style={{ fontFamily: MONO, fontSize: 8, color, fontWeight: 700 }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 4, background: `rgba(${colorRgb},0.1)`, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: 2, boxShadow: `0 0 8px rgba(${colorRgb},0.5)`, transition: "width 0.6s ease-out" }} />
      </div>
    </div>
  );
}

function ComponentBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ fontFamily: MONO, fontSize: 8, color: "rgba(255,255,255,0.35)", width: 120, flexShrink: 0, letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ flex: 1, height: 3, background: "rgba(139,92,246,0.1)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2, boxShadow: `0 0 6px ${color}80` }} />
      </div>
      <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color, width: 28, textAlign: "right" }}>{value}</div>
    </div>
  );
}

function formatInr(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export default function TrajectoryDashboardPage() {
  const { data, isLoading } = useGetTrajectoryDashboard();

  const dash = data?.isSuccess ? data : null;

  const weeklyScore = dash?.score_components?.weighted_total ?? 0;
  const hasScore = dash?.score_components != null;
  const driftStatus = dash?.drift_status ?? "on_track";
  const driftScore = dash?.drift_score ?? null;
  const driftColor = driftStatus === "on_track" ? "#22c55e" : driftStatus === "drifting" ? "#eab308" : "#ef4444";
  const driftRgb = driftStatus === "on_track" ? "34,197,94" : driftStatus === "drifting" ? "234,179,8" : "239,68,68";
  const driftLabel = driftStatus === "on_track" ? "ON TRACK" : driftStatus === "drifting" ? "DRIFTING" : "MISALIGNED";

  const escapeNumber = dash?.escape_number ?? null;
  const investedCapital = dash?.current_invested_capital ?? 0;
  const escapePct = escapeNumber && escapeNumber > 0 ? Math.round((investedCapital / escapeNumber) * 100) : 0;

  const recentScores = dash?.recent_scores ?? [];

  const tc = dash?.score_components?.task_completion ?? 0;
  const el = dash?.score_components?.elimination ?? 0;
  const da = dash?.score_components?.decision_alignment ?? 0;
  const cf = dash?.score_components?.confidence ?? 0;

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, height: "100%" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        .traj-shell { display: flex; flex: 1; height: 100%; min-height: 0; background: #07050f; position: relative; overflow: hidden; flex-direction: column; }
        .traj-shell::before { content: ''; position: absolute; inset: 0; background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.007) 2px, rgba(139,92,246,0.007) 4px); pointer-events: none; z-index: 0; }
        .traj-shell::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 15% 50%, rgba(109,40,217,0.12) 0%, transparent 60%), radial-gradient(ellipse at 85% 20%, rgba(139,92,246,0.04) 0%, transparent 45%); pointer-events: none; z-index: 0; }
        .traj-scroll { flex: 1; overflow-y: auto; padding: 20px 24px; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 14px; }
        .traj-scroll::-webkit-scrollbar { width: 4px; }
        .traj-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.2); border-radius: 2px; }
        .traj-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        @media (max-width: 900px) { .traj-grid-3 { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) { .traj-grid-3 { grid-template-columns: 1fr; } }
        @keyframes trajFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .traj-animate { animation: trajFadeIn 0.25s ease-out forwards; }
      `}</style>

      <div className="traj-shell">
        {/* Header */}
        <div style={{ position: "relative", zIndex: 1, borderBottom: "1px solid rgba(139,92,246,0.1)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(6,4,12,0.55)", backdropFilter: "blur(2px)", flexShrink: 0, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, color: "rgba(139,92,246,0.5)", textShadow: "0 0 10px rgba(139,92,246,0.3)" }}>◆</span>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.22em", fontWeight: 700, color: "#ffffff" }}>TRAJECTORY INTELLIGENCE</div>
              <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.12em", color: "rgba(139,92,246,0.4)", marginTop: 1 }}>5/3/1 planasy · escape engine</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px", background: `rgba(${driftRgb},0.08)`, border: `1px solid rgba(${driftRgb},0.25)`, borderRadius: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: driftColor, boxShadow: `0 0 8px ${driftColor}` }} />
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: driftColor, letterSpacing: "0.1em" }}>{driftLabel}</span>
            {driftScore !== null && (
              <span style={{ fontFamily: MONO, fontSize: 8, color: `rgba(${driftRgb},0.6)` }}>DRIFT SCORE: {driftScore}</span>
            )}
          </div>
        </div>

        <div className="traj-scroll traj-animate">
          {/* Row 1: Score ring + component breakdown + check-in prompt */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "start" }}>
            {/* Weekly score ring */}
            <div style={{ background: "rgba(14,9,26,0.9)", border: "1px solid rgba(139,92,246,0.14)", borderRadius: 8, padding: "20px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <ScoreRing score={hasScore ? weeklyScore : 0} label="WEEKLY SCORE" size={140} />
              {!hasScore && (
                <div style={{ fontFamily: MONO, fontSize: 8, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>No score yet this week</div>
              )}
            </div>

            {/* Score components */}
            <div style={{ background: "rgba(14,9,26,0.9)", border: "1px solid rgba(139,92,246,0.14)", borderRadius: 8, padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.14em", color: "rgba(139,92,246,0.5)", fontWeight: 700 }}>SCORE BREAKDOWN</div>
              {hasScore ? (
                <>
                  <ComponentBar label="TASK COMPLETION (40%)" value={tc} color="#a78bfa" />
                  <ComponentBar label="ELIMINATION (25%)" value={el} color="#22c55e" />
                  <ComponentBar label="DECISION ALIGN (25%)" value={da} color="#06b6d4" />
                  <ComponentBar label="CONFIDENCE (10%)" value={cf} color="#eab308" />
                  <div style={{ height: 1, background: "rgba(139,92,246,0.08)" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>COMPOSITE WEEKLY SCORE</span>
                    <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: weeklyScore >= 70 ? "#22c55e" : weeklyScore >= 40 ? "#eab308" : "#ef4444" }}>{weeklyScore} / 100</span>
                  </div>
                </>
              ) : (
                <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
                  No check-in for this week yet. The cron job computes scores every Sunday night. You can also lock in your week manually via <span style={{ color: "#a78bfa" }}>/quests/checkin</span>.
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Escape number tracker */}
          {escapeNumber && escapeNumber > 0 && (
            <div style={{ background: "rgba(14,9,26,0.9)", border: "1px solid rgba(167,139,250,0.14)", borderRadius: 8, padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.14em", color: "rgba(167,139,250,0.5)", fontWeight: 700 }}>ESCAPE NUMBER TRACKER</div>
                <div style={{ fontFamily: MONO, fontSize: 8, color: "rgba(255,255,255,0.3)" }}>
                  TARGET: <span style={{ color: "#eab308", fontWeight: 700 }}>{formatInr(escapeNumber)}</span>
                </div>
              </div>
              <ProgressBar
                label={`${formatInr(investedCapital)} of ${formatInr(escapeNumber)}`}
                value={escapePct}
                max={100}
                color="#a78bfa"
                colorRgb="167,139,250"
              />
              {dash?.projected_arrival_date && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                  <div style={{ fontFamily: MONO, fontSize: 8, color: "rgba(255,255,255,0.25)" }}>
                    FULL EXECUTION → <span style={{ color: "#22c55e" }}>{formatDate(dash.projected_arrival_date)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Income gap warning */}
          {dash?.income_gap_warning && dash.income_gap_amount && (
            <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "10px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 10, color: "#ef4444", flexShrink: 0, marginTop: 1 }}>△</span>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, color: "#ef4444", letterSpacing: "0.1em", marginBottom: 3 }}>INCOME GAP WARNING</div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                  Current income → estimated investable gap: <span style={{ color: "#ef4444" }}>{formatInr(dash.income_gap_amount)}/month</span>. Income must grow to close this — saving harder alone won't work.
                </div>
              </div>
            </div>
          )}

          {/* 4-week history sparkline */}
          {recentScores.length > 0 && (
            <div style={{ background: "rgba(14,9,26,0.9)", border: "1px solid rgba(139,92,246,0.14)", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.14em", color: "rgba(139,92,246,0.5)", fontWeight: 700, marginBottom: 12 }}>RECENT HISTORY</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[...recentScores].reverse().map((s, i) => {
                  const c = s.score >= 70 ? "#22c55e" : s.score >= 40 ? "#eab308" : "#ef4444";
                  const wkLabel = `W${s.period_start.slice(5, 7)}/${s.period_start.slice(8, 10)}`;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, alignItems: "center" }}>
                      <div style={{ width: "100%", height: 40, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                        <div style={{ width: "60%", height: `${s.score * 0.4}px`, background: c, borderRadius: "2px 2px 0 0", boxShadow: `0 0 8px ${c}60`, transition: "height 0.4s ease-out" }} />
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: c }}>{Math.round(s.score)}</div>
                      <div style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.25)" }}>{wkLabel}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!dash && (
            <div style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.3)", padding: "24px", textAlign: "center" }}>
              No trajectory data yet. Set up your Vision Vault to get started.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

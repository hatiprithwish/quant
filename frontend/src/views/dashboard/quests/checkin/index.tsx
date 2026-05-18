import { useState } from "react";
import { useGetWeeklyCheckin } from "@/api/cachedQueries";
import { useMutationLockInWeek, useMutationSubmitCheckinCorrection } from "@/api/mutations";
import Spinner from "@/components/common/Spinner";
import type { TaskCompletionAnalysis, EliminationAnalysis, DecisionAlignmentAnalysis, ConfidenceAnalysis } from "@/schemas";

const MONO = "'JetBrains Mono','Fira Code','Courier New',monospace";

function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  now.setDate(now.getDate() + diff);
  return now.toISOString().slice(0, 10);
}

function SectionCard({
  title, weight, color, colorRgb, score, children, correctionOpen, onToggleCorrection,
}: {
  title: string; weight: string; color: string; colorRgb: string; score: number | null;
  children: React.ReactNode; correctionOpen: boolean; onToggleCorrection: () => void;
}) {
  return (
    <div style={{ background: "rgba(14,9,26,0.9)", border: `1px solid rgba(${colorRgb},0.14)`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid rgba(${colorRgb},0.08)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", fontWeight: 700, color }}>{title}</div>
          <span style={{ fontFamily: MONO, fontSize: 7, color: `rgba(${colorRgb},0.5)`, background: `rgba(${colorRgb},0.08)`, border: `1px solid rgba(${colorRgb},0.18)`, padding: "1px 6px", borderRadius: 2 }}>{weight}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {score !== null && (
            <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color, textShadow: `0 0 12px ${color}60` }}>{Math.round(score)}</span>
          )}
          <button
            onClick={onToggleCorrection}
            style={{ fontFamily: MONO, fontSize: 7, letterSpacing: "0.1em", padding: "3px 8px", borderRadius: 3, background: correctionOpen ? `rgba(${colorRgb},0.12)` : "rgba(139,92,246,0.06)", border: correctionOpen ? `1px solid rgba(${colorRgb},0.3)` : "1px solid rgba(139,92,246,0.15)", color: correctionOpen ? color : "rgba(167,139,250,0.5)", cursor: "pointer" }}
          >
            ⇄ CORRECT
          </button>
        </div>
      </div>
      <div style={{ padding: "12px 16px" }}>{children}</div>
      {correctionOpen && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid rgba(${colorRgb},0.1)`, background: `rgba(${colorRgb},0.03)` }}>
          <div style={{ fontFamily: MONO, fontSize: 7, letterSpacing: "0.12em", color: `rgba(${colorRgb},0.55)`, fontWeight: 700, marginBottom: 6 }}>
            CORRECTION NOTE — what did the AI get wrong?
          </div>
          <textarea
            rows={2}
            placeholder="e.g. I actually completed the critical path task on Wednesday, AI missed it."
            style={{ width: "100%", background: `rgba(${colorRgb},0.04)`, border: `1px solid rgba(${colorRgb},0.18)`, borderRadius: 4, fontFamily: MONO, fontSize: 10, color: "#e2d9f3", padding: "7px 10px", resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }}
          />
        </div>
      )}
    </div>
  );
}

function TaskCompletionContent({ data }: { data: TaskCompletionAnalysis }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ fontFamily: MONO, fontSize: 8, color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>
        {data.completed_tasks} of {data.total_tasks} tasks completed · {data.critical_path_completed} of {data.critical_path_total} critical path
      </div>
      {data.task_details.map((t, i) => {
        const statusColor = t.status === "done" ? "#22c55e" : t.status === "missed" ? "#ef4444" : "#eab308";
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid rgba(139,92,246,0.06)" }}>
            <span style={{ fontSize: 8, color: statusColor, flexShrink: 0 }}>{t.status === "done" ? "✓" : t.status === "missed" ? "×" : "○"}</span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: "#c4b5fd", flex: 1 }}>{t.name}</span>
            {t.phase_tag && (
              <span style={{ fontFamily: MONO, fontSize: 7, color: t.phase_tag === "critical_path" ? "#a78bfa" : "rgba(255,255,255,0.3)", background: t.phase_tag === "critical_path" ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${t.phase_tag === "critical_path" ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.08)"}`, padding: "1px 5px", borderRadius: 2 }}>
                {t.phase_tag === "critical_path" ? "CRITICAL" : t.phase_tag.toUpperCase()}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EliminationContent({ data }: { data: EliminationAnalysis }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {data.items.map((item, i) => {
        const c = item.result === "stopped" ? "#22c55e" : item.result === "partial" ? "#eab308" : "#ef4444";
        const rgb = item.result === "stopped" ? "34,197,94" : item.result === "partial" ? "234,179,8" : "239,68,68";
        return (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 8px", background: `rgba(${rgb},0.05)`, borderRadius: 4, border: `1px solid ${c}20` }}>
            <span style={{ fontSize: 8, color: c, flexShrink: 0, marginTop: 1 }}>{item.result === "stopped" ? "✓" : item.result === "partial" ? "◑" : "×"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: "#c4b5fd" }}>{item.description}</div>
              <div style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>{item.evidence}</div>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 7, color: item.source === "auto" ? "#06b6d4" : "#a78bfa", background: item.source === "auto" ? "rgba(6,182,212,0.1)" : "rgba(167,139,250,0.1)", border: `1px solid ${item.source === "auto" ? "rgba(6,182,212,0.2)" : "rgba(167,139,250,0.2)"}`, padding: "1px 5px", borderRadius: 2 }}>
              {item.source === "auto" ? "AUTO" : "MANUAL"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DecisionContent({ data }: { data: DecisionAlignmentAnalysis }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {data.decisions.map((d, i) => {
        const c = d.alignment === "green" || d.alignment === "aligned" ? "#22c55e" : d.alignment === "amber" || d.alignment === "neutral" ? "#eab308" : "#ef4444";
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: c, flexShrink: 0 }} />
            <div style={{ fontFamily: MONO, fontSize: 9, color: "#c4b5fd", flex: 1 }}>{d.description}</div>
            <span style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.2)" }}>{d.date}</span>
          </div>
        );
      })}
    </div>
  );
}

function ConfidenceContent({ data }: { data: ConfidenceAnalysis }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 9, color: "#c4b5fd", marginBottom: 6 }}>{data.basis}</div>
      <div style={{ fontFamily: MONO, fontSize: 8, color: "rgba(255,255,255,0.3)" }}>
        Daily pulse logged: {data.pulse_days_logged} / 7 days
      </div>
    </div>
  );
}

function PendingState() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
      <div style={{ textAlign: "center", padding: "0 24px" }}>
        <div style={{ fontFamily: MONO, fontSize: 32, color: "rgba(139,92,246,0.3)", marginBottom: 16 }}>△</div>
        <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", marginBottom: 8 }}>
          NO REVIEW THIS WEEK
        </div>
        <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.2)", lineHeight: 1.7 }}>
          AI analysis runs Sunday night.<br />
          Come back Monday to review and lock in your week.
        </div>
      </div>
    </div>
  );
}

export default function WeeklyCheckinPage() {
  const weekStart = getMondayOfCurrentWeek();
  const { data, isLoading, refetch } = useGetWeeklyCheckin(weekStart);
  const lockInMutation = useMutationLockInWeek();
  const correctionMutation = useMutationSubmitCheckinCorrection();

  const [corrections, setCorrections] = useState<Record<string, boolean>>({});
  const [correctionTexts] = useState<Record<string, string>>({});
  const [locked, setLocked] = useState(false);

  const toggleCorrection = (id: string) => {
    setCorrections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checkin = data?.checkin;
  const analysis = data?.analysis;

  const tc = checkin?.task_completion_score ?? analysis?.task_completion.score ?? 0;
  const el = checkin?.elimination_score ?? analysis?.elimination.score ?? 0;
  const da = checkin?.decision_alignment_score ?? analysis?.decision_alignment.score ?? 0;
  const cf = checkin?.confidence_score ?? analysis?.confidence.score ?? 0;
  const compositeScore = Math.round(tc * 0.4 + el * 0.25 + da * 0.25 + cf * 0.1);
  const scoreColor = compositeScore >= 70 ? "#22c55e" : compositeScore >= 40 ? "#eab308" : "#ef4444";

  const handleLockIn = async () => {
    const activeCorrectionTexts = Object.fromEntries(
      Object.entries(correctionTexts).filter(([, v]) => v.trim())
    );
    if (Object.keys(activeCorrectionTexts).length > 0) {
      await correctionMutation.mutateAsync({ week_start: weekStart, corrections: activeCorrectionTexts });
    }
    await lockInMutation.mutateAsync({ week_start: weekStart });
    setLocked(true);
    refetch();
  };

  const alreadyReviewed = checkin?.status === "reviewed";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        .checkin-shell { display: flex; flex: 1; height: 100%; min-height: 0; background: #07050f; position: relative; overflow: hidden; flex-direction: column; }
        .checkin-shell::before { content: ''; position: absolute; inset: 0; background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.007) 2px, rgba(139,92,246,0.007) 4px); pointer-events: none; z-index: 0; }
        .checkin-shell::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 15% 50%, rgba(109,40,217,0.12) 0%, transparent 60%); pointer-events: none; z-index: 0; }
        .checkin-scroll { flex: 1; overflow-y: auto; padding: 20px 24px; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 12px; }
        .checkin-scroll::-webkit-scrollbar { width: 4px; }
        .checkin-scroll::-webkit-scrollbar-track { background: transparent; }
        .checkin-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.2); border-radius: 2px; }
        @keyframes ciIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .ci-animate { animation: ciIn 0.25s ease-out forwards; }
      `}</style>

      <div className="checkin-shell">
        {/* Header */}
        <div style={{ position: "relative", zIndex: 1, borderBottom: "1px solid rgba(139,92,246,0.1)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(6,4,12,0.55)", backdropFilter: "blur(2px)", flexShrink: 0, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, color: "rgba(139,92,246,0.5)", textShadow: "0 0 10px rgba(139,92,246,0.3)" }}>△</span>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.22em", fontWeight: 700, color: "#ffffff" }}>WEEK IN REVIEW</div>
              <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.12em", color: "rgba(139,92,246,0.4)", marginTop: 1 }}>
                {weekStart} · AI-generated analysis
              </div>
            </div>
          </div>
          {checkin && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px", background: `${scoreColor}10`, border: `1px solid ${scoreColor}30`, borderRadius: 4 }}>
              <span style={{ fontFamily: MONO, fontSize: 8, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>SCORE PREVIEW</span>
              <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: scoreColor }}>{compositeScore}</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
            <Spinner />
          </div>
        ) : !checkin || !analysis ? (
          <PendingState />
        ) : locked || alreadyReviewed ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
              <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: "#22c55e", letterSpacing: "0.15em", marginBottom: 6 }}>WEEK LOCKED IN</div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                Score {checkin.weekly_score !== null ? Math.round(checkin.weekly_score) : compositeScore} recorded · See you next Monday
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Review-ready banner */}
            <div style={{ position: "relative", zIndex: 1, background: "rgba(167,139,250,0.06)", borderBottom: "1px solid rgba(139,92,246,0.12)", padding: "8px 24px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa", boxShadow: "0 0 8px #a78bfa", flexShrink: 0 }} />
              <span style={{ fontFamily: MONO, fontSize: 8, color: "#c4b5fd", letterSpacing: "0.08em" }}>
                YOUR WEEK IN REVIEW IS READY — Review the AI analysis below, correct anything wrong, then lock it in.
              </span>
            </div>

            <div className="checkin-scroll ci-animate">
              {/* AI Narrative */}
              <div style={{ background: "rgba(14,9,26,0.9)", border: "1px solid rgba(139,92,246,0.14)", borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.14em", color: "rgba(139,92,246,0.5)", fontWeight: 700, marginBottom: 8 }}>AI NARRATIVE</div>
                <p style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: 0 }}>{analysis.narrative}</p>
              </div>

              {/* Task Completion */}
              <SectionCard title="TASK COMPLETION" weight="40%" color="#a78bfa" colorRgb="167,139,250" score={analysis.task_completion.score} correctionOpen={!!corrections["task_completion"]} onToggleCorrection={() => toggleCorrection("task_completion")}>
                <TaskCompletionContent data={analysis.task_completion} />
              </SectionCard>

              {/* Elimination */}
              <SectionCard title="ELIMINATION" weight="25%" color="#22c55e" colorRgb="34,197,94" score={analysis.elimination.score} correctionOpen={!!corrections["elimination"]} onToggleCorrection={() => toggleCorrection("elimination")}>
                <EliminationContent data={analysis.elimination} />
              </SectionCard>

              {/* Decision Alignment */}
              <SectionCard title="DECISION ALIGNMENT" weight="25%" color="#06b6d4" colorRgb="6,182,212" score={analysis.decision_alignment.score} correctionOpen={!!corrections["decision_alignment"]} onToggleCorrection={() => toggleCorrection("decision_alignment")}>
                <DecisionContent data={analysis.decision_alignment} />
              </SectionCard>

              {/* Confidence */}
              <SectionCard title="CONFIDENCE" weight="10%" color="#eab308" colorRgb="234,179,8" score={analysis.confidence.score} correctionOpen={!!corrections["confidence"]} onToggleCorrection={() => toggleCorrection("confidence")}>
                <ConfidenceContent data={analysis.confidence} />
              </SectionCard>

              {/* Lock In CTA */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "rgba(14,9,26,0.9)", border: "1px solid rgba(139,92,246,0.14)", borderRadius: 8, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>
                    Final score: <span style={{ color: scoreColor, fontWeight: 700, fontSize: 14 }}>{compositeScore}</span> / 100
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>
                    {Object.values(corrections).filter(Boolean).length > 0
                      ? `${Object.values(corrections).filter(Boolean).length} correction(s) noted — AI will improve next week`
                      : "No corrections — AI analysis accepted as-is"}
                  </div>
                </div>
                <button
                  onClick={handleLockIn}
                  disabled={lockInMutation.isPending}
                  style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", fontWeight: 700, padding: "8px 20px", borderRadius: 4, background: "#7c3aed", border: "none", color: "#fff", cursor: "pointer", boxShadow: "0 0 20px rgba(124,58,237,0.45)", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 30px rgba(124,58,237,0.7)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(124,58,237,0.45)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
                >
                  {lockInMutation.isPending ? "LOCKING IN…" : "✓ LOCK IN WEEK"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

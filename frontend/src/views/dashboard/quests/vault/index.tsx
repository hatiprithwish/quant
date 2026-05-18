import { useState } from "react";
import { useGetVault } from "@/api/cachedQueries";
import { useMutationCreateVaultQuest, useMutationUpdateVaultQuest } from "@/api/mutations";
import Spinner from "@/components/common/Spinner";
import type { TrajectoryQuestData } from "@/schemas";

const MONO = "'JetBrains Mono','Fira Code','Courier New',monospace";

const PHASES = [
  { key: "five_year", label: "5 YEARS", sub: "LIFE VISION", accent: "#a78bfa", accentRgb: "167,139,250", cap: null, hint: "unlimited" },
  { key: "three_year", label: "3 YEARS", sub: "STRUCTURAL TIPPING POINT", accent: "#22c55e", accentRgb: "34,197,94", cap: null, hint: "links to 5-yr goals" },
  { key: "one_year", label: "1 YEAR", sub: "PROOF OF CONCEPT", accent: "#06b6d4", accentRgb: "6,182,212", cap: null, hint: "annual runway" },
  { key: "quarterly", label: "90 DAYS", sub: "CRITICAL PATH", accent: "#eab308", accentRgb: "234,179,8", cap: 3, hint: "max 3 active" },
  { key: "weekly", label: "7 DAYS", sub: "THIS WEEK", accent: "#a78bfa", accentRgb: "139,92,246", cap: null, hint: "resets Monday" },
] as const;

type PhaseKey = "five_year" | "three_year" | "one_year" | "quarterly" | "weekly";

function formatInr(n: number) {
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(1)} L`;
  return n.toLocaleString("en-IN");
}

interface GoalCardProps {
  quest: TrajectoryQuestData;
  accentRgb: string;
  phaseKey: PhaseKey;
  onUpdated: () => void;
}

function GoalCard({ quest, accentRgb, phaseKey, onUpdated }: GoalCardProps) {
  const [open, setOpen] = useState(false);
  const [showCooling, setShowCooling] = useState(false);
  const [editDesc, setEditDesc] = useState(quest.description ?? "");
  const [saving, setSaving] = useState(false);
  const updateMutation = useMutationUpdateVaultQuest();
  const isWeekly = phaseKey === "weekly";
  const isQuarterly = phaseKey === "quarterly";

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMutation.mutateAsync({ questId: quest.id, description: editDesc } as Parameters<typeof updateMutation.mutateAsync>[0]);
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const statusColor = quest.status === "done" ? "#22c55e" : quest.status === "paused" ? "#6b7280" : `rgba(${accentRgb},0.7)`;

  return (
    <div
      style={{ background: "rgba(14,9,26,0.9)", border: `1px solid rgba(${accentRgb},0.14)`, borderRadius: 6, overflow: "hidden", transition: "border-color 0.2s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${accentRgb},0.3)`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${accentRgb},0.14)`; }}
    >
      {/* Card header */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", userSelect: "none" }}
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ fontSize: 9, color: `rgba(${accentRgb},0.45)`, flexShrink: 0 }}>◆</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: "#e2d9f3", letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {quest.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
            <span style={{ fontFamily: MONO, fontSize: 7, color: statusColor, background: `rgba(${accentRgb},0.06)`, border: `1px solid rgba(${accentRgb},0.18)`, padding: "1px 5px", borderRadius: 2, letterSpacing: "0.08em" }}>
              {quest.status.toUpperCase()}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em" }}>
              ✎ {new Date(quest.updated_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
        <span style={{ fontSize: 8, color: `rgba(${accentRgb},0.5)`, transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block", flexShrink: 0 }}>›</span>
      </div>

      {/* Expanded body */}
      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: `1px solid rgba(${accentRgb},0.08)`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* 5-year: escape number field */}
          {phaseKey === "five_year" && quest.escape_number && (
            <div>
              <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.12em", color: "rgba(167,139,250,0.6)", fontWeight: 700, marginBottom: 5 }}>
                ESCAPE NUMBER · <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.25)" }}>financial freedom target</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ background: "rgba(167,139,250,0.08)", padding: "7px 10px", fontFamily: MONO, fontSize: 12, fontWeight: 700, color: "#a78bfa", borderRight: "1px solid rgba(167,139,250,0.15)" }}>₹</div>
                <div style={{ flex: 1, fontFamily: MONO, fontSize: 14, fontWeight: 700, color: "#eab308", padding: "6px 10px" }}>
                  {formatInr(quest.escape_number)}
                </div>
              </div>
            </div>
          )}

          {/* Goal description */}
          <div>
            <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.12em", color: `rgba(${accentRgb},0.55)`, fontWeight: 700, marginBottom: 5 }}>
              {isWeekly ? "WEEKLY FOCUS" : isQuarterly ? "MACRO PROBLEM TO SOLVE" : "GOAL DESCRIPTION"}
            </div>
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              style={{ width: "100%", background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 4, fontFamily: MONO, fontSize: 11, color: "#c4b5fd", padding: "8px 10px", resize: "none", outline: "none", lineHeight: 1.5, boxSizing: "border-box" }}
            />
            {editDesc !== (quest.description ?? "") && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.1em", padding: "4px 12px", borderRadius: 3, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e", cursor: "pointer" }}
                >
                  {saving ? "SAVING…" : "✓ SAVE"}
                </button>
              </div>
            )}
          </div>

          {/* Deadline if set */}
          {quest.deadline && (
            <div style={{ fontFamily: MONO, fontSize: 8, color: "rgba(255,255,255,0.3)" }}>
              DEADLINE: <span style={{ color: "#eab308" }}>{new Date(quest.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          )}

          {/* Edit request button (non-weekly/non-new) */}
          {!isWeekly && quest.status === "active" && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <button
                onClick={() => setShowCooling((s) => !s)}
                style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.1em", fontWeight: 700, padding: "4px 10px", borderRadius: 3, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", cursor: "pointer" }}
              >
                ⚠ REQUEST EDIT (−500 XP)
              </button>
            </div>
          )}

          {/* Cooling-off */}
          {showCooling && (
            <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "12px 14px" }}>
              <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.1em", fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>
                ⚠ GOAL CHANGE REQUEST — 30-HOUR COOLING-OFF PERIOD
              </div>
              <textarea
                rows={2}
                placeholder="Why is this goal changing? Be honest. This feeds your Goal Stability Score."
                style={{ width: "100%", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 4, fontFamily: MONO, fontSize: 10, color: "#fca5a5", padding: "7px 10px", resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 8 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowCooling(false)} style={{ flex: 1, fontFamily: MONO, fontSize: 8, letterSpacing: "0.08em", padding: "5px 0", borderRadius: 3, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e", cursor: "pointer" }}>
                  ✓ CANCEL CHANGE (KEEP XP)
                </button>
                <button style={{ flex: 1, fontFamily: MONO, fontSize: 8, letterSpacing: "0.08em", padding: "5px 0", borderRadius: 3, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", cursor: "pointer" }}>
                  CONFIRM (LOSE 500 XP)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PhaseGroupProps {
  phase: (typeof PHASES)[number];
  quests: TrajectoryQuestData[];
  quarterlyActiveCount: number;
  quarterlyMax: number;
  onAdded: () => void;
  onUpdated: () => void;
}

function PhaseGroup({ phase, quests, quarterlyActiveCount, quarterlyMax, onAdded, onUpdated }: PhaseGroupProps) {
  const createMutation = useMutationCreateVaultQuest();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const isQuarterly = phase.key === "quarterly";
  const activeCount = isQuarterly ? quarterlyActiveCount : quests.length;
  const cap = isQuarterly ? quarterlyMax : phase.cap;
  const atCap = cap !== null && isQuarterly && quarterlyActiveCount >= quarterlyMax;

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await createMutation.mutateAsync({ name: newName.trim(), trajectory_phase: phase.key });
      setNewName("");
      onAdded();
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{ background: "rgba(10,7,20,0.5)", border: `1px solid rgba(${phase.accentRgb},0.1)`, borderRadius: 8, overflow: "hidden" }}>
      {/* Phase header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid rgba(${phase.accentRgb},0.08)`, background: `rgba(${phase.accentRgb},0.03)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: phase.accent, background: `rgba(${phase.accentRgb},0.1)`, border: `1px solid rgba(${phase.accentRgb},0.22)`, padding: "2px 7px", borderRadius: 3 }}>
            {phase.label}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>
            {phase.sub}
          </span>
          {cap !== null ? (
            <span style={{ fontFamily: MONO, fontSize: 7, color: atCap ? "#ef4444" : phase.accent, background: `rgba(${phase.accentRgb},0.08)`, border: `1px solid rgba(${phase.accentRgb},0.2)`, padding: "1px 6px", borderRadius: 3 }}>
              {activeCount} / {cap} ACTIVE
            </span>
          ) : (
            <span style={{ fontFamily: MONO, fontSize: 7, color: "rgba(255,255,255,0.2)" }}>{phase.hint}</span>
          )}
        </div>
        <button
          onClick={() => { if (!atCap) { setNewName("New Goal"); } }}
          disabled={atCap}
          style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.1em", fontWeight: 700, padding: "3px 10px", borderRadius: 3, background: atCap ? "rgba(255,255,255,0.03)" : `rgba(${phase.accentRgb},0.1)`, border: `1px solid ${atCap ? "rgba(255,255,255,0.08)" : `rgba(${phase.accentRgb},0.25)`}`, color: atCap ? "rgba(255,255,255,0.2)" : phase.accent, cursor: atCap ? "not-allowed" : "pointer" }}
        >
          {phase.key === "weekly" ? "+ ADD PLAN" : "+ ADD GOAL"}
        </button>
      </div>

      {/* Quick-add form */}
      {newName !== "" && (
        <div style={{ padding: "10px 14px", borderBottom: `1px solid rgba(${phase.accentRgb},0.08)`, display: "flex", gap: 8, alignItems: "center" }}>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setNewName(""); }}
            placeholder="Goal name…"
            style={{ flex: 1, background: `rgba(${phase.accentRgb},0.05)`, border: `1px solid rgba(${phase.accentRgb},0.2)`, borderRadius: 4, fontFamily: MONO, fontSize: 11, color: "#e2d9f3", padding: "6px 10px", outline: "none" }}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            style={{ fontFamily: MONO, fontSize: 8, padding: "5px 12px", borderRadius: 3, background: `rgba(${phase.accentRgb},0.15)`, border: `1px solid rgba(${phase.accentRgb},0.3)`, color: phase.accent, cursor: "pointer" }}
          >
            {adding ? "ADDING…" : "ADD"}
          </button>
          <button
            onClick={() => setNewName("")}
            style={{ fontFamily: MONO, fontSize: 8, padding: "5px 10px", borderRadius: 3, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}
          >
            CANCEL
          </button>
        </div>
      )}

      {/* Goals list */}
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {quests.length === 0 && newName === "" && (
          <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "12px 0" }}>
            No {phase.key === "weekly" ? "plans" : "goals"} yet — add one above
          </div>
        )}
        {quests.map((q) => (
          <GoalCard
            key={q.id}
            quest={q}
            accentRgb={phase.accentRgb}
            phaseKey={phase.key}
            onUpdated={onUpdated}
          />
        ))}
        {atCap && (
          <div style={{ fontFamily: MONO, fontSize: 8, color: "#eab308", background: "rgba(234,179,8,0.05)", border: "1px dashed rgba(234,179,8,0.2)", borderRadius: 4, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span>△</span>
            <span>MAX {cap} ACTIVE QUARTERLY GOALS. Complete or archive an existing goal to add a new one.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VisionVaultPage() {
  const { data, isLoading, refetch } = useGetVault();

  const totalGoals = data
    ? (data.five_year?.length ?? 0) + (data.three_year?.length ?? 0) + (data.one_year?.length ?? 0) + (data.quarterly?.length ?? 0) + (data.weekly?.length ?? 0)
    : 0;
  const maxGoals = 10;

  const phaseData: Record<PhaseKey, TrajectoryQuestData[]> = {
    five_year: data?.five_year ?? [],
    three_year: data?.three_year ?? [],
    one_year: data?.one_year ?? [],
    quarterly: data?.quarterly ?? [],
    weekly: data?.weekly ?? [],
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        .vault-shell { display: flex; flex: 1; height: 100%; min-height: 0; background: #07050f; position: relative; overflow: hidden; flex-direction: column; }
        .vault-shell::before { content: ''; position: absolute; inset: 0; background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.007) 2px, rgba(139,92,246,0.007) 4px); pointer-events: none; z-index: 0; }
        .vault-shell::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 15% 50%, rgba(109,40,217,0.12) 0%, transparent 60%), radial-gradient(ellipse at 85% 20%, rgba(139,92,246,0.04) 0%, transparent 45%); pointer-events: none; z-index: 0; }
        .vault-scroll { flex: 1; overflow-y: auto; padding: 24px; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 14px; }
        .vault-scroll::-webkit-scrollbar { width: 4px; }
        .vault-scroll::-webkit-scrollbar-track { background: transparent; }
        .vault-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.2); border-radius: 2px; }
        @keyframes vaultFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .vault-animate { animation: vaultFadeIn 0.25s ease-out forwards; }
      `}</style>

      <div className="vault-shell">
        {/* Header */}
        <div style={{ position: "relative", zIndex: 1, borderBottom: "1px solid rgba(139,92,246,0.1)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(6,4,12,0.55)", backdropFilter: "blur(2px)", flexShrink: 0, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, color: "rgba(139,92,246,0.5)", textShadow: "0 0 10px rgba(139,92,246,0.3)" }}>◎</span>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.22em", fontWeight: 700, color: "#ffffff" }}>VISION VAULT</div>
              <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.12em", color: "rgba(139,92,246,0.4)", marginTop: 1 }}>single source of truth · all scores measured against this</div>
            </div>
          </div>
          {data && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontFamily: MONO, fontSize: 8, color: "rgba(255,255,255,0.3)" }}>{totalGoals} GOALS SET</div>
              <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: "#22c55e" }}>{totalGoals} / {maxGoals}</div>
              <div style={{ width: 80, height: 4, background: "rgba(34,197,94,0.1)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (totalGoals / maxGoals) * 100)}%`, height: "100%", background: "linear-gradient(90deg, #16a34a, #22c55e)", boxShadow: "0 0 8px rgba(34,197,94,0.5)", borderRadius: 2 }} />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
            <Spinner />
          </div>
        ) : (
          <div className="vault-scroll vault-animate">
            {PHASES.map((phase) => (
              <PhaseGroup
                key={phase.key}
                phase={phase}
                quests={phaseData[phase.key]}
                quarterlyActiveCount={data?.quarterly_active_count ?? 0}
                quarterlyMax={data?.quarterly_max ?? 3}
                onAdded={() => refetch()}
                onUpdated={() => refetch()}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

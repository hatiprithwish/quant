import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useGetQuestDetail } from "@/api/cachedQueries";
import Spinner from "@/components/common/Spinner";
import {
  useMutationUpdateTaskStatus,
  useMutationCreateTask,
  useMutationCreateMilestone,
  type CreateTaskInput,
  type CreateMilestoneInput,
} from "@/api/mutations";
import {
  questCategoryIcon,
  QuestStatusEnum,
  MilestoneStatusEnum,
  TaskStatusEnum,
} from "@/schemas";

function fmtMins(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function ProgressRing({ pct, color, size = 72 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(139,92,246,0.12)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: "stroke-dashoffset 0.4s ease" }}
      />
      <text
        x={size / 2} y={size / 2 + 5}
        textAnchor="middle" fontSize={13} fontWeight={700} fill={color}
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

const MILESTONE_DOT: Record<MilestoneStatusEnum, { color: string; glow: string }> = {
  [MilestoneStatusEnum.Done]: { color: "#10b981", glow: "rgba(16,185,129,0.5)" },
  [MilestoneStatusEnum.Active]: { color: "#8b5cf6", glow: "rgba(139,92,246,0.6)" },
  [MilestoneStatusEnum.Pending]: { color: "rgba(139,92,246,0.25)", glow: "none" },
};

const TASK_ICON: Record<TaskStatusEnum, string> = {
  [TaskStatusEnum.Todo]: "○",
  [TaskStatusEnum.Doing]: "◑",
  [TaskStatusEnum.Done]: "●",
};

const TASK_COLOR: Record<TaskStatusEnum, string> = {
  [TaskStatusEnum.Todo]: "rgba(139,92,246,0.3)",
  [TaskStatusEnum.Doing]: "#8b5cf6",
  [TaskStatusEnum.Done]: "#10b981",
};

export default function QuestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetQuestDetail(id ?? "");

  const updateStatus = useMutationUpdateTaskStatus();
  const createTask = useMutationCreateTask(id ?? "");
  const createMilestone = useMutationCreateMilestone(id ?? "");

  const [newTaskName, setNewTaskName] = useState("");
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [addingMilestone, setAddingMilestone] = useState(false);

  if (isLoading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "64px 0",
        background: "#07050f", minHeight: "100%",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Spinner />
          <div style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 9, letterSpacing: "0.2em",
            color: "rgba(139,92,246,0.4)",
          }}>LOADING...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        border: "1px solid rgba(239,68,68,0.3)",
        background: "rgba(239,68,68,0.08)",
        borderRadius: 6, padding: "12px 16px", margin: 24,
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 10, color: "rgba(239,68,68,0.8)",
      }}>
        ✕ FAILED TO LOAD QUEST
      </div>
    );
  }

  const { quest, milestones, tasks, time_by_day, growth_vs_distraction } = data;
  const taskPct = quest.task_total > 0 ? (quest.task_done / quest.task_total) * 100 : 0;
  const xpPct = quest.xp_max > 0 ? Math.min((quest.total_xp / quest.xp_max) * 100, 100) : 0;
  const badge = STATUS_BADGE[quest.status];

  const activeMilestone = milestones.find(m => m.status === MilestoneStatusEnum.Active);
  const activeMilestoneTasks = activeMilestone
    ? tasks.filter(t => t.milestone_id === activeMilestone.id)
    : tasks.filter(t => t.milestone_id === null);

  function submitTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    const input: CreateTaskInput = { name: newTaskName.trim(), milestone_id: activeMilestone?.id };
    createTask.mutate(input, { onSuccess: () => { setNewTaskName(""); setAddingTask(false); } });
  }

  function submitMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!newMilestoneName.trim()) return;
    const input: CreateMilestoneInput = { name: newMilestoneName.trim() };
    createMilestone.mutate(input, { onSuccess: () => { setNewMilestoneName(""); setAddingMilestone(false); } });
  }

  const chartData = time_by_day.map(d => ({
    date: d.date.slice(5),
    hours: +(d.minutes / 60).toFixed(1),
  }));

  const growthTotal = growth_vs_distraction.growth_minutes + growth_vs_distraction.distraction_minutes;
  const growthPct = growthTotal > 0 ? (growth_vs_distraction.growth_minutes / growthTotal) * 100 : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        .detail-shell {
          min-height: 100%;
          background: #07050f;
          padding: 24px;
          position: relative;
        }
        .detail-shell::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: repeating-linear-gradient(
            0deg,
            transparent, transparent 2px,
            rgba(139,92,246,0.006) 2px,
            rgba(139,92,246,0.006) 4px
          );
          pointer-events: none;
          z-index: 0;
        }
        .detail-content { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 20px; }
        .detail-panel {
          background: rgba(14,9,26,0.9);
          border: 1px solid rgba(139,92,246,0.14);
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }
        .detail-panel-header {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(139,92,246,0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .detail-input {
          flex: 1;
          background: rgba(139,92,246,0.06);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 3px;
          padding: 5px 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #ddd6fe;
          outline: none;
          transition: border-color 0.15s;
        }
        .detail-input:focus { border-color: rgba(139,92,246,0.45); }
        .detail-input::placeholder { color: rgba(139,92,246,0.25); }
        .detail-btn {
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.1em;
          padding: 4px 10px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s;
          background: rgba(139,92,246,0.15);
          border: 1px solid rgba(139,92,246,0.3);
          color: #a78bfa;
        }
        .detail-btn:hover { background: rgba(139,92,246,0.25); color: #c4b5fd; }
        .detail-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div className="detail-shell">
        <div className="detail-content">
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => navigate("/quests")}
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 8, letterSpacing: "0.12em",
                color: "rgba(139,92,246,0.4)",
                background: "none", border: "none", cursor: "pointer",
                padding: 0, transition: "color 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#a78bfa"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(139,92,246,0.4)"; }}
            >QUESTS</button>
            <span style={{ color: "rgba(139,92,246,0.2)", fontSize: 10 }}>/</span>
            <span style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 8, letterSpacing: "0.1em",
              color: "rgba(167,139,250,0.6)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{quest.name.toUpperCase()}</span>
          </div>

          {/* Quest hero card */}
          <div className="detail-panel" style={{ padding: 20 }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: quest.color,
              boxShadow: `0 0 12px ${quest.color}`,
            }} />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
              <ProgressRing pct={taskPct} color={quest.color} size={80} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: quest.color, textShadow: `0 0 6px ${quest.color}` }}>
                    {questCategoryIcon[quest.category]}
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 7, letterSpacing: "0.15em",
                    color: "rgba(167,139,250,0.35)", textTransform: "uppercase",
                  }}>{quest.category}</span>
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 7, letterSpacing: "0.1em", fontWeight: 700,
                    padding: "2px 6px", borderRadius: 2,
                    background: badge.bg, color: badge.color,
                  }}>{badge.label}</span>
                  {quest.streak > 0 && (
                    <span style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 8, color: "#fbbf24",
                    }}>🔥 {quest.streak}d streak</span>
                  )}
                </div>

                <h2 style={{
                  fontSize: 20, fontWeight: 700,
                  color: "#ddd6fe",
                  marginBottom: 8, lineHeight: 1.3,
                }}>{quest.name}</h2>

                {quest.description && (
                  <p style={{
                    fontSize: 12, color: "rgba(167,139,250,0.45)",
                    marginBottom: 12, lineHeight: 1.6,
                  }}>{quest.description}</p>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7, letterSpacing: "0.12em", color: "rgba(139,92,246,0.38)" }}>XP </span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: "#fbbf24" }}>
                      {quest.total_xp} / {quest.xp_max}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7, letterSpacing: "0.12em", color: "rgba(139,92,246,0.38)" }}>TIME </span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>
                      {fmtMins(quest.time_this_week_minutes)} this week
                    </span>
                  </div>
                  {quest.deadline && (
                    <div>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7, letterSpacing: "0.12em", color: "rgba(139,92,246,0.38)" }}>DUE </span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: "rgba(167,139,250,0.7)" }}>
                        {quest.deadline}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{
                  height: 4,
                  background: "rgba(139,92,246,0.1)",
                  borderRadius: 2, overflow: "hidden", width: 240,
                  border: "1px solid rgba(139,92,246,0.08)",
                }}>
                  <div style={{
                    height: "100%", width: `${xpPct}%`,
                    background: `linear-gradient(90deg, ${quest.color}aa, ${quest.color})`,
                    boxShadow: `0 0 6px ${quest.color}`,
                    borderRadius: 2, transition: "width 0.4s ease",
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Main 3-column grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {/* Milestones */}
            <div className="detail-panel">
              <div className="detail-panel-header">
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9, letterSpacing: "0.14em", fontWeight: 700,
                  color: "rgba(167,139,250,0.6)",
                }}>MILESTONES</span>
                <button
                  className="detail-btn"
                  onClick={() => setAddingMilestone(v => !v)}
                >+ ADD</button>
              </div>

              {addingMilestone && (
                <form onSubmit={submitMilestone} style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid rgba(139,92,246,0.08)",
                  display: "flex", gap: 8,
                }}>
                  <input
                    autoFocus
                    value={newMilestoneName}
                    onChange={e => setNewMilestoneName(e.target.value)}
                    placeholder="Milestone name..."
                    className="detail-input"
                  />
                  <button
                    type="submit"
                    disabled={createMilestone.isPending}
                    className="detail-btn"
                  >ADD</button>
                </form>
              )}

              <div style={{ padding: 16 }}>
                {milestones.length === 0 ? (
                  <p style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 8, color: "rgba(139,92,246,0.25)",
                    textAlign: "center", padding: "20px 0", letterSpacing: "0.1em",
                  }}>NO MILESTONES YET</p>
                ) : (
                  milestones.map((m, i) => {
                    const dotStyle = MILESTONE_DOT[m.status];
                    return (
                      <div key={m.id} style={{ display: "flex", gap: 12 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{
                            width: 10, height: 10, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                            background: dotStyle.color,
                            boxShadow: dotStyle.glow !== "none" ? `0 0 6px ${dotStyle.glow}` : "none",
                          }} />
                          {i < milestones.length - 1 && (
                            <div style={{
                              width: 1, flex: 1, margin: "4px 0",
                              background: "rgba(139,92,246,0.12)",
                            }} />
                          )}
                        </div>
                        <div style={{ paddingBottom: 14, minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4 }}>
                            <span style={{
                              fontSize: 11, fontWeight: 500,
                              color: m.status === MilestoneStatusEnum.Done
                                ? "rgba(167,139,250,0.3)"
                                : "#ddd6fe",
                              textDecoration: m.status === MilestoneStatusEnum.Done ? "line-through" : "none",
                              lineHeight: 1.4,
                            }}>{m.name}</span>
                            <span style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              fontSize: 8, color: "#fbbf24", flexShrink: 0, opacity: 0.7,
                            }}>+{m.xp_reward}xp</span>
                          </div>
                          <div style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 7, color: "rgba(139,92,246,0.3)", marginTop: 3,
                          }}>
                            {m.task_done}/{m.task_total} tasks{m.due_date && ` · ${m.due_date}`}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Tasks */}
            <div className="detail-panel">
              <div className="detail-panel-header">
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9, letterSpacing: "0.14em", fontWeight: 700,
                  color: "rgba(167,139,250,0.6)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{activeMilestone ? activeMilestone.name.toUpperCase() : "TASKS"}</span>
                <button
                  className="detail-btn"
                  onClick={() => setAddingTask(v => !v)}
                  style={{ flexShrink: 0 }}
                >+ ADD</button>
              </div>

              {addingTask && (
                <form onSubmit={submitTask} style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid rgba(139,92,246,0.08)",
                  display: "flex", gap: 8,
                }}>
                  <input
                    autoFocus
                    value={newTaskName}
                    onChange={e => setNewTaskName(e.target.value)}
                    placeholder="Task name..."
                    className="detail-input"
                  />
                  <button
                    type="submit"
                    disabled={createTask.isPending}
                    className="detail-btn"
                  >ADD</button>
                </form>
              )}

              <div>
                {activeMilestoneTasks.length === 0 ? (
                  <p style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 8, color: "rgba(139,92,246,0.25)",
                    textAlign: "center", padding: "24px 0", letterSpacing: "0.1em",
                  }}>NO TASKS</p>
                ) : (
                  activeMilestoneTasks.map(t => {
                    const nextStatus = t.status === TaskStatusEnum.Todo
                      ? TaskStatusEnum.Doing
                      : t.status === TaskStatusEnum.Doing
                      ? TaskStatusEnum.Done
                      : null;
                    return (
                      <div
                        key={t.id}
                        style={{
                          padding: "10px 16px",
                          display: "flex", alignItems: "center", gap: 10,
                          borderBottom: "1px solid rgba(139,92,246,0.06)",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(139,92,246,0.04)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                      >
                        <button
                          onClick={() => nextStatus && updateStatus.mutate({ taskId: t.id, status: nextStatus })}
                          disabled={!nextStatus || updateStatus.isPending}
                          style={{
                            fontSize: 14, flexShrink: 0,
                            color: TASK_COLOR[t.status],
                            background: "none", border: "none", cursor: nextStatus ? "pointer" : "default",
                            padding: 0, lineHeight: 1,
                            textShadow: t.status !== TaskStatusEnum.Todo ? `0 0 6px ${TASK_COLOR[t.status]}` : "none",
                            transition: "color 0.15s",
                          }}
                        >{TASK_ICON[t.status]}</button>
                        <span style={{
                          flex: 1, fontSize: 12,
                          color: t.status === TaskStatusEnum.Done ? "rgba(167,139,250,0.3)" : "#ddd6fe",
                          textDecoration: t.status === TaskStatusEnum.Done ? "line-through" : "none",
                          lineHeight: 1.4,
                        }}>{t.name}</span>
                        {t.xp_reward > 0 && (
                          <span style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 8, color: "#fbbf24", opacity: 0.7,
                          }}>+{t.xp_reward}xp</span>
                        )}
                        {t.due_date && (
                          <span style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            fontSize: 7, color: "rgba(139,92,246,0.3)",
                          }}>{t.due_date.slice(5)}</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right column: chart + focus + XP log */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {chartData.length > 0 && (
                <div className="detail-panel" style={{ padding: 16 }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 8, letterSpacing: "0.14em", fontWeight: 700,
                    color: "rgba(139,92,246,0.45)",
                    marginBottom: 12,
                  }}>TIME · LAST 14 DAYS</div>
                  <ResponsiveContainer width="100%" height={90}>
                    <BarChart data={chartData} barSize={7}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 8, fill: "rgba(139,92,246,0.35)", fontFamily: "'JetBrains Mono',monospace" }}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 8, fill: "rgba(139,92,246,0.35)", fontFamily: "'JetBrains Mono',monospace" }}
                        unit="h" width={24} axisLine={false} tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#130d24",
                          border: "1px solid rgba(139,92,246,0.2)",
                          borderRadius: 4, fontSize: 10,
                          fontFamily: "'JetBrains Mono',monospace",
                        }}
                        formatter={v => [`${v}h`, "Time"]}
                      />
                      <Bar
                        dataKey="hours"
                        fill={quest.color}
                        radius={[2, 2, 0, 0]}
                        style={{ filter: `drop-shadow(0 0 3px ${quest.color})` }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="detail-panel" style={{ padding: 16 }}>
                <div style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 8, letterSpacing: "0.14em", fontWeight: 700,
                  color: "rgba(139,92,246,0.45)",
                  marginBottom: 10,
                }}>FOCUS SPLIT</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#10b981" }}>
                    {+(growth_vs_distraction.growth_minutes / 60).toFixed(1)}h growth
                  </span>
                  <span style={{ color: "rgba(139,92,246,0.2)" }}>/</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#ef4444" }}>
                    {+(growth_vs_distraction.distraction_minutes / 60).toFixed(1)}h dist.
                  </span>
                </div>
                <div style={{
                  height: 4, background: "rgba(139,92,246,0.08)",
                  borderRadius: 2, overflow: "hidden", display: "flex",
                }}>
                  <div style={{ height: "100%", background: "#10b981", width: `${growthPct}%`, boxShadow: "0 0 4px rgba(16,185,129,0.5)" }} />
                  <div style={{ height: "100%", background: "#ef4444", flex: 1 }} />
                </div>
              </div>

              {data.recent_xp_events.length > 0 && (
                <div className="detail-panel">
                  <div className="detail-panel-header">
                    <span style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 8, letterSpacing: "0.14em", fontWeight: 700,
                      color: "rgba(139,92,246,0.45)",
                    }}>RECENT XP</span>
                  </div>
                  <div>
                    {data.recent_xp_events.slice(0, 6).map(e => (
                      <div
                        key={e.id}
                        style={{
                          padding: "8px 16px",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          borderBottom: "1px solid rgba(139,92,246,0.06)",
                        }}
                      >
                        <span style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 8, color: "rgba(167,139,250,0.4)",
                          letterSpacing: "0.06em", textTransform: "capitalize",
                        }}>{e.source_type.replace(/_/g, " ")}</span>
                        <span style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 9, fontWeight: 700,
                          color: "#fbbf24", opacity: 0.8,
                        }}>+{e.xp} xp</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

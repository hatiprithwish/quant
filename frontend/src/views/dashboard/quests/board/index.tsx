import { Link } from "react-router-dom";
import { useGetQuestsKanban } from "@/api/cachedQueries";
import { useMutationUpdateTaskStatus } from "@/api/mutations";
import { TaskStatusEnum, questCategoryIcon } from "@/schemas";
import type { KanbanTask } from "@/schemas";
import Spinner from "@/components/common/Spinner";

function TaskCard({ task }: { task: KanbanTask }) {
  const update = useMutationUpdateTaskStatus();
  const nextStatus =
    task.status === TaskStatusEnum.Todo
      ? TaskStatusEnum.Doing
      : task.status === TaskStatusEnum.Doing
      ? TaskStatusEnum.Done
      : null;

  return (
    <div
      style={{
        background: "rgba(14,9,26,0.9)",
        border: "1px solid rgba(139,92,246,0.13)",
        borderRadius: 6, padding: 12,
        display: "flex", gap: 10,
        transition: "all 0.15s",
        position: "relative", overflow: "hidden",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "rgba(139,92,246,0.28)";
        el.style.boxShadow = "0 0 12px rgba(139,92,246,0.08)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = "rgba(139,92,246,0.13)";
        el.style.boxShadow = "none";
      }}
    >
      <div style={{
        width: 2, borderRadius: 2, flexShrink: 0,
        background: task.quest_color,
        alignSelf: "stretch",
        boxShadow: `0 0 6px ${task.quest_color}`,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 9, color: "rgba(167,139,250,0.35)" }}>
            {questCategoryIcon[task.quest_category as keyof typeof questCategoryIcon] ?? "◆"}
          </span>
          <Link
            to={`/quests/${task.quest_id}`}
            onClick={e => e.stopPropagation()}
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 8, color: "rgba(139,92,246,0.38)",
              textDecoration: "none", letterSpacing: "0.05em",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              transition: "color 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#a78bfa"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(139,92,246,0.38)"; }}
          >{task.quest_name}</Link>
        </div>

        <p style={{
          fontSize: 12, color: "#ddd6fe",
          fontWeight: 500, lineHeight: 1.4, marginBottom: 8,
        }}>{task.name}</p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {task.due_date && (
              <span style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 8, color: "rgba(167,139,250,0.3)",
              }}>{task.due_date.slice(5)}</span>
            )}
            {task.xp_reward > 0 && (
              <span style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 8, color: "#fbbf24", opacity: 0.8,
              }}>+{task.xp_reward}xp</span>
            )}
          </div>
          {nextStatus && (
            <button
              onClick={() => update.mutate({ taskId: task.id, status: nextStatus })}
              disabled={update.isPending}
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 8, letterSpacing: "0.08em",
                padding: "2px 7px", borderRadius: 3,
                background: nextStatus === TaskStatusEnum.Done
                  ? "rgba(16,185,129,0.12)"
                  : "rgba(139,92,246,0.12)",
                border: `1px solid ${nextStatus === TaskStatusEnum.Done
                  ? "rgba(16,185,129,0.28)"
                  : "rgba(139,92,246,0.25)"}`,
                color: nextStatus === TaskStatusEnum.Done ? "#10b981" : "#a78bfa",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {nextStatus === TaskStatusEnum.Doing ? "START →" : "DONE ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const COLUMNS = [
  { key: "todo", title: "TODO", glyph: "○", accent: "rgba(167,139,250,0.55)" },
  { key: "doing", title: "IN PROGRESS", glyph: "◑", accent: "#8b5cf6" },
  { key: "done", title: "COMPLETED", glyph: "●", accent: "#10b981" },
] as const;

function Column({ title, tasks, accent, glyph }: { title: string; tasks: KanbanTask[]; accent: string; glyph: string }) {
  return (
    <div style={{
      background: "rgba(10,7,20,0.65)",
      border: "1px solid rgba(139,92,246,0.1)",
      borderRadius: 8, padding: 16,
      display: "flex", flexDirection: "column",
      minHeight: 200,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 10, color: accent }}>{glyph}</span>
        <span style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 9, letterSpacing: "0.15em", fontWeight: 700,
          color: accent,
        }}>{title}</span>
        <div style={{
          marginLeft: "auto",
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 8, color: "rgba(167,139,250,0.38)",
          background: "rgba(139,92,246,0.08)",
          border: "1px solid rgba(139,92,246,0.14)",
          padding: "1px 7px", borderRadius: 10,
        }}>{tasks.length}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {tasks.length === 0 ? (
          <div style={{
            border: "1px dashed rgba(139,92,246,0.1)",
            borderRadius: 6, padding: "32px 0",
            textAlign: "center",
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 8, color: "rgba(139,92,246,0.22)",
            letterSpacing: "0.12em",
          }}>EMPTY</div>
        ) : (
          tasks.map(t => <TaskCard key={t.id} task={t} />)
        )}
      </div>
    </div>
  );
}

export default function QuestsBoardPage() {
  const { data, isLoading, error } = useGetQuestsKanban();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
        .board-shell {
          display: flex;
          flex: 1;
          height: 100%;
          min-height: 0;
          background: #07050f;
          position: relative;
          overflow: hidden;
          flex-direction: column;
        }
        .board-shell::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(139,92,246,0.007) 2px,
            rgba(139,92,246,0.007) 4px
          );
          pointer-events: none;
          z-index: 0;
        }
        .board-shell::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 10%, rgba(109,40,217,0.05) 0%, transparent 55%);
          pointer-events: none;
          z-index: 0;
        }
        .board-content {
          position: relative;
          z-index: 1;
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .board-content::-webkit-scrollbar { width: 4px; }
        .board-content::-webkit-scrollbar-track { background: transparent; }
        .board-content::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.2); border-radius: 2px; }
      `}</style>

      <div className="board-shell">
        <div style={{
          position: "relative", zIndex: 1,
          borderBottom: "1px solid rgba(139,92,246,0.1)",
          padding: "14px 24px",
          display: "flex", alignItems: "center", gap: 12,
          background: "rgba(6,4,12,0.55)",
          backdropFilter: "blur(2px)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: "rgba(139,92,246,0.5)", textShadow: "0 0 10px rgba(139,92,246,0.3)" }}>⊞</span>
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11, letterSpacing: "0.22em", fontWeight: 700,
              color: "#ffffff",
            }}>KANBAN BOARD</div>
            <div style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 8, letterSpacing: "0.12em",
              color: "rgba(139,92,246,0.4)",
              marginTop: 1,
            }}>task pipeline</div>
          </div>
          <Link
            to="/quests"
            style={{
              marginLeft: "auto",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9, letterSpacing: "0.1em",
              padding: "4px 10px", borderRadius: 3,
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.2)",
              color: "rgba(167,139,250,0.55)",
              textDecoration: "none", transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#a78bfa"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(167,139,250,0.55)"; }}
          >← QUEST BOARD</Link>
        </div>

        <div className="board-content">
          {isLoading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
              <Spinner />
            </div>
          )}
          {error && (
            <div style={{
              border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.08)",
              borderRadius: 6, padding: "12px 16px",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10, color: "rgba(239,68,68,0.8)",
            }}>✕ FAILED TO LOAD BOARD</div>
          )}
          {data && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}>
              {COLUMNS.map(col => (
                <Column
                  key={col.key}
                  title={col.title}
                  tasks={data[col.key]}
                  accent={col.accent}
                  glyph={col.glyph}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

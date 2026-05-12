import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useGetQuestsDashboard } from "@/api/cachedQueries";
import QuestCard from "./components/QuestCard";
import XpHeroStrip from "./components/XpHeroStrip";
import GrowthVsDistractionChart from "./components/GrowthVsDistractionChart";
import AchievementsSection from "./components/AchievementsSection";
import CreateQuestModal from "./components/CreateQuestModal";
import { QuestStatusEnum } from "@/schemas";
import Spinner from "@/components/common/Spinner";
import DateRangeDropdown, { getPresetRange } from "@/components/common/DateRangeDropdown";

const QUEST_NAV = [
  { label: "ALL QUESTS", sub: "full roster", glyph: "◈", value: null },
  { label: "ACTIVE", sub: "in progress", glyph: "▶", value: QuestStatusEnum.Active },
  { label: "PAUSED", sub: "on hold", glyph: "⏸", value: QuestStatusEnum.Paused },
  { label: "DONE", sub: "completed", glyph: "✓", value: QuestStatusEnum.Done },
] as const;

const VALID_QUEST_STATUSES = [QuestStatusEnum.Active, QuestStatusEnum.Paused, QuestStatusEnum.Done] as const;

function QuestRail({ status, setStatus }: { status: QuestStatusEnum | null; setStatus: (s: QuestStatusEnum | null) => void }) {
  return (
    <aside style={{
      width: 160,
      flexShrink: 0,
      background: "rgba(6,4,12,0.75)",
      borderRight: "1px solid rgba(139,92,246,0.12)",
      display: "flex",
      flexDirection: "column",
      padding: "16px 0",
      position: "relative",
      backdropFilter: "blur(4px)",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 20%, rgba(139,92,246,0.04) 0%, transparent 70%)",
      }} />

      <div style={{
        padding: "0 12px 12px",
        borderBottom: "1px solid rgba(139,92,246,0.08)",
        marginBottom: 8,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 8, letterSpacing: "0.22em",
          color: "rgba(139,92,246,0.45)",
          marginBottom: 2,
        }}>SECTOR</div>
        <div style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 11, letterSpacing: "0.18em", fontWeight: 700,
          color: "#a78bfa",
          textShadow: "0 0 12px rgba(167,139,250,0.5)",
        }}>QUESTS</div>
      </div>

      <nav style={{ flex: 1, padding: "0 6px", display: "flex", flexDirection: "column", gap: 1 }}>
        {QUEST_NAV.map(item => {
          const active = status === item.value;
          return (
            <button
              key={String(item.value)}
              onClick={() => setStatus(item.value)}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "flex-start",
                padding: "8px 8px",
                background: active ? "rgba(139,92,246,0.12)" : "transparent",
                border: "none",
                borderLeftWidth: 2,
                borderLeftStyle: "solid",
                borderLeftColor: active ? "#8b5cf6" : "transparent",
                borderRadius: "0 4px 4px 0",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.06)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
                <span style={{
                  fontSize: 10, color: active ? "#a78bfa" : "rgba(139,92,246,0.3)",
                  transition: "color 0.15s", flexShrink: 0,
                  textShadow: active ? "0 0 8px rgba(167,139,250,0.7)" : "none",
                }}>{item.glyph}</span>
                <span style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: 9, letterSpacing: "0.12em", fontWeight: 700,
                  color: active ? "#fff" : "rgba(255,255,255,0.3)",
                  transition: "color 0.15s", flex: 1,
                }}>{item.label}</span>
                {active && (
                  <div style={{
                    width: 3, height: 3, borderRadius: "50%",
                    background: "#8b5cf6",
                    boxShadow: "0 0 6px #8b5cf6",
                    flexShrink: 0,
                  }} />
                )}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 7, letterSpacing: "0.1em",
                color: active ? "rgba(167,139,250,0.6)" : "rgba(255,255,255,0.18)",
                marginLeft: 16, marginTop: 1,
                transition: "color 0.15s",
              }}>{item.sub}</div>
            </button>
          );
        })}
      </nav>

      <div style={{
        padding: "10px 12px",
        borderTop: "1px solid rgba(139,92,246,0.08)",
        borderBottom: "1px solid rgba(139,92,246,0.06)",
        marginTop: 8,
      }}>
        <Link
          to="/quests/board"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 8, letterSpacing: "0.1em",
            color: "rgba(139,92,246,0.4)",
            textDecoration: "none",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#a78bfa"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(139,92,246,0.4)"; }}
        >
          <span>⊞</span>
          <span>KANBAN</span>
          <span style={{ marginLeft: "auto" }}>→</span>
        </Link>
      </div>

      <div style={{
        padding: "10px 12px 0",
        marginTop: 4,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 7, letterSpacing: "0.1em",
          color: "rgba(139,92,246,0.22)",
          lineHeight: 1.6,
        }}>
          <div>SYS · QUESTS</div>
          <div>STATUS · ONLINE</div>
        </div>
      </div>
    </aside>
  );
}

export default function QuestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status") as QuestStatusEnum | null;
  const statusFilter: QuestStatusEnum | null =
    statusParam && (VALID_QUEST_STATUSES as readonly string[]).includes(statusParam) ? statusParam : null;

  function setStatusFilter(s: QuestStatusEnum | null) {
    setSearchParams(prev => {
      if (s === null) prev.delete("status");
      else prev.set("status", s);
      return prev;
    });
  }

  const [from, setFrom] = useState(() => getPresetRange("thisWeek").from);
  const [to, setTo] = useState(() => getPresetRange("thisWeek").to);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, error } = useGetQuestsDashboard(from, to);
  const filteredQuests = data?.quests.filter(q =>
    statusFilter === null ? true : q.status === statusFilter
  ) ?? [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

        .quest-shell {
          display: flex;
          flex: 1;
          height: 100%;
          min-height: 0;
          background: #07050f;
          position: relative;
          overflow: hidden;
        }
        .quest-shell::before {
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
        .quest-shell::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 15% 50%, rgba(109,40,217,0.06) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 20%, rgba(139,92,246,0.03) 0%, transparent 45%);
          pointer-events: none;
          z-index: 0;
        }
        .quest-content-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          position: relative;
          z-index: 1;
          overflow: visible;
        }
        .quest-header {
          border-bottom: 1px solid rgba(139,92,246,0.1);
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(6,4,12,0.5);
          backdrop-filter: blur(2px);
          flex-shrink: 0;
          flex-wrap: wrap;
          gap: 10px;
        }
        .quest-tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .quest-tab-content::-webkit-scrollbar { width: 4px; }
        .quest-tab-content::-webkit-scrollbar-track { background: transparent; }
        .quest-tab-content::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.2); border-radius: 2px; }
        .quest-tab-content::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.4); }
        .quest-rail-wrapper { position: relative; z-index: 2; }
        @media (max-width: 640px) {
          .quest-rail-wrapper { display: none; }
          .quest-tab-content { padding: 16px; }
          .quest-header { padding: 10px 16px; }
        }

        @keyframes questFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .quest-animate-in {
          animation: questFadeIn 0.25s ease-out forwards;
        }
        .quest-main-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 16px;
          align-items: start;
        }
        .quest-left-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }
        .quest-right-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 0;
        }
        .quest-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 12px;
        }
        @media (max-width: 900px) {
          .quest-main-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .quest-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="quest-shell">
        <div className="quest-rail-wrapper">
          <QuestRail status={statusFilter} setStatus={setStatusFilter} />
        </div>

        <div className="quest-content-area">
          <div className="quest-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                fontSize: 14, color: "rgba(139,92,246,0.5)",
                textShadow: "0 0 10px rgba(139,92,246,0.3)",
              }}>⚔</span>
              <div>
                <div style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: 11, letterSpacing: "0.22em", fontWeight: 700,
                  color: "#ffffff",
                }}>QUEST BOARD</div>
                <div style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: 8, letterSpacing: "0.12em",
                  color: "rgba(139,92,246,0.45)",
                  marginTop: 1,
                }}>adventure log</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <DateRangeDropdown
                accent="#a78bfa"
                panelBg="#07050f"
                align="right"
                from={from}
                to={to}
                onChange={(f, t) => { setFrom(f); setTo(t); }}
              />

              <button
                onClick={() => setShowCreate(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px",
                  background: "#7c3aed",
                  border: "none",
                  borderRadius: 4,
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: 10, letterSpacing: "0.1em", fontWeight: 700,
                  color: "#fff", cursor: "pointer",
                  boxShadow: "0 0 16px rgba(124,58,237,0.4)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(124,58,237,0.65)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(124,58,237,0.4)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }}
              >
                + NEW QUEST
              </button>
            </div>
          </div>

          <div className="quest-tab-content">
            {isLoading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <Spinner />
                  <div style={{
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    fontSize: 9, letterSpacing: "0.2em",
                    color: "rgba(139,92,246,0.4)",
                  }}>LOADING...</div>
                </div>
              </div>
            )}

            {error && (
              <div style={{
                border: "1px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.08)",
                borderRadius: 6, padding: "12px 16px",
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 10, letterSpacing: "0.08em",
                color: "rgba(239,68,68,0.8)",
              }}>
                ✕ FAILED TO LOAD QUESTS
              </div>
            )}

            {data && (
              <div className="quest-animate-in">
                <div className="quest-main-grid">
                  {/* Left: XP strip + quest cards stacked */}
                  <div className="quest-left-col">
                    <XpHeroStrip
                      levelInfo={data.level_info}
                      currentStreak={data.current_streak}
                      activeQuestsCount={data.active_quests_count}
                      focusScore={data.focus_score}
                    />

                    {filteredQuests.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "48px 0" }}>
                        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>⚔</div>
                        <div style={{
                          fontFamily: "'JetBrains Mono','Fira Code',monospace",
                          color: "rgba(139,92,246,0.45)", fontSize: 11, letterSpacing: "0.15em", fontWeight: 700,
                        }}>NO QUESTS</div>
                        <div style={{
                          fontFamily: "'JetBrains Mono','Fira Code',monospace",
                          color: "rgba(255,255,255,0.18)", fontSize: 9, letterSpacing: "0.1em", marginTop: 8,
                        }}>Start your journey by creating your first quest.</div>
                      </div>
                    ) : (
                      <div className="quest-cards-grid">
                        {filteredQuests.map(q => <QuestCard key={q.id} quest={q} />)}
                      </div>
                    )}
                  </div>

                  {/* Right: growth chart + achievements */}
                  <div className="quest-right-col">
                    <GrowthVsDistractionChart data={data.growth_vs_distraction} />
                    <AchievementsSection achievements={data.achievements} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreate && <CreateQuestModal onClose={() => setShowCreate(false)} />}
    </>
  );
}

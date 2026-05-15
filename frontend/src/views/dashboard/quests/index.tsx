import { useState } from "react";
import { useGetQuestsDashboard } from "@/api/cachedQueries";
import QuestCard from "./components/QuestCard";
import XpHeroStrip from "./components/XpHeroStrip";
import GrowthVsDistractionChart from "./components/GrowthVsDistractionChart";
import AchievementsSection from "./components/AchievementsSection";
import CreateQuestModal from "./components/CreateQuestModal";
import { QuestStatusEnum } from "@/schemas";
import Spinner from "@/components/common/Spinner";
import DateRangeDropdown, { getPresetRange } from "@/components/common/DateRangeDropdown";

export type QuestFilter = "all" | "active" | "paused" | "done";

const FILTER_TO_STATUS: Record<QuestFilter, QuestStatusEnum | null> = {
  all:    null,
  active: QuestStatusEnum.Active,
  paused: QuestStatusEnum.Paused,
  done:   QuestStatusEnum.Done,
};

export default function QuestsPage({ filter = "all" }: { filter?: QuestFilter }) {
  const [from, setFrom] = useState(() => getPresetRange("thisWeek").from);
  const [to, setTo] = useState(() => getPresetRange("thisWeek").to);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, error } = useGetQuestsDashboard(from, to);

  const statusFilter = FILTER_TO_STATUS[filter];
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
        @media (max-width: 640px) {
          .quest-tab-content { padding: 16px; }
          .quest-header { padding: 10px 16px; }
        }
        @keyframes questFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .quest-animate-in { animation: questFadeIn 0.25s ease-out forwards; }
        .quest-main-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 16px;
          align-items: start;
        }
        .quest-left-col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .quest-right-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
        .quest-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 12px;
        }
        @media (max-width: 900px) {
          .quest-main-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .quest-cards-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="quest-shell">
        <div className="quest-content-area">
          <div className="quest-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, color: "rgba(139,92,246,0.5)", textShadow: "0 0 10px rgba(139,92,246,0.3)" }}>⚔</span>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 11, letterSpacing: "0.22em", fontWeight: 700, color: "#ffffff" }}>
                  QUEST BOARD
                </div>
                <div style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 8, letterSpacing: "0.12em", color: "rgba(139,92,246,0.45)", marginTop: 1 }}>
                  adventure log
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <DateRangeDropdown accent="#a78bfa" panelBg="#07050f" align="right" from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", background: "#7c3aed", border: "none", borderRadius: 4,
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: 10, letterSpacing: "0.1em", fontWeight: 700,
                  color: "#fff", cursor: "pointer",
                  boxShadow: "0 0 16px rgba(124,58,237,0.4)", transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(124,58,237,0.65)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(124,58,237,0.4)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }}
              >+ NEW QUEST</button>
            </div>
          </div>

          <div className="quest-tab-content">
            {isLoading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <Spinner />
                  <div style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(139,92,246,0.4)" }}>LOADING...</div>
                </div>
              </div>
            )}

            {error && (
              <div style={{ border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", borderRadius: 6, padding: "12px 16px", fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 10, letterSpacing: "0.08em", color: "rgba(239,68,68,0.8)" }}>
                ✕ FAILED TO LOAD QUESTS
              </div>
            )}

            {data && (
              <div className="quest-animate-in">
                <div className="quest-main-grid">
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
                        <div style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", color: "rgba(139,92,246,0.45)", fontSize: 11, letterSpacing: "0.15em", fontWeight: 700 }}>NO QUESTS</div>
                        <div style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", color: "rgba(255,255,255,0.18)", fontSize: 9, letterSpacing: "0.1em", marginTop: 8 }}>Start your journey by creating your first quest.</div>
                      </div>
                    ) : (
                      <div className="quest-cards-grid">
                        {filteredQuests.map(q => <QuestCard key={q.id} quest={q} />)}
                      </div>
                    )}
                  </div>
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

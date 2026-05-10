import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useGetQuestsDashboard } from "@/api/cachedQueries";
import QuestCard from "./components/QuestCard";
import XpHeroStrip from "./components/XpHeroStrip";
import GrowthVsDistractionChart from "./components/GrowthVsDistractionChart";
import AchievementsSection from "./components/AchievementsSection";
import CreateQuestModal from "./components/CreateQuestModal";
import { QuestStatusEnum } from "@/schemas";

function today() {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split("T")[0];
}

function startOfQuarter() {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3);
  d.setMonth(q * 3, 1);
  return d.toISOString().split("T")[0];
}

function startOfYear() {
  const d = new Date();
  d.setMonth(0, 1);
  return d.toISOString().split("T")[0];
}

const PRESETS = [
  { label: "Today", from: today(), to: today() },
  { label: "Week", from: daysAgo(6), to: today() },
  { label: "Month", from: startOfMonth(), to: today() },
  { label: "Quarter", from: startOfQuarter(), to: today() },
  { label: "Year", from: startOfYear(), to: today() },
];

const STATUS_FILTERS = [
  { label: "All", value: null },
  { label: "Active", value: QuestStatusEnum.Active },
  { label: "Paused", value: QuestStatusEnum.Paused },
  { label: "Done", value: QuestStatusEnum.Done },
];

const VALID_QUEST_STATUSES = [QuestStatusEnum.Active, QuestStatusEnum.Paused, QuestStatusEnum.Done] as const;

export default function QuestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status") as QuestStatusEnum | null;
  const statusFilter: QuestStatusEnum | null =
    statusParam && (VALID_QUEST_STATUSES as readonly string[]).includes(statusParam) ? statusParam : null;

  function setStatusFilter(s: QuestStatusEnum | null) {
    setSearchParams((prev) => {
      if (s === null) prev.delete("status");
      else prev.set("status", s);
      return prev;
    });
  }

  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(today());
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, error } = useGetQuestsDashboard(from, to);

  const filteredQuests = data?.quests.filter(q =>
    statusFilter === null ? true : q.status === statusFilter
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Quests</h2>
          <Link
            to="/quests/board"
            className="px-2.5 py-1 rounded-md text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Kanban →
          </Link>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1">
            {PRESETS.map(p => {
              const active = p.from === from && p.to === to;
              return (
                <button
                  key={p.label}
                  onClick={() => { setFrom(p.from); setTo(p.to); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Quest
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">Loading…</div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          Failed to load quests.
        </div>
      )}

      {data && (
        <>
          <XpHeroStrip
            levelInfo={data.level_info}
            currentStreak={data.current_streak}
            activeQuestsCount={data.active_quests_count}
            focusScore={data.focus_score}
            growthVsDistraction={data.growth_vs_distraction}
          />

          <div className="flex items-center gap-2">
            {STATUS_FILTERS.map(f => (
              <button
                key={String(f.value)}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === f.value
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                {f.label}
                {f.value === null && data.quests.length > 0 && (
                  <span className="ml-1 text-gray-400 dark:text-gray-500">({data.quests.length})</span>
                )}
              </button>
            ))}
          </div>

          {filteredQuests.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-600 text-sm">
              <div className="mb-3 text-4xl">⚔️</div>
              <p className="font-medium text-gray-400">No quests yet</p>
              <p className="mt-1">Start your journey by creating your first quest.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredQuests.map(q => (
                <QuestCard key={q.id} quest={q} />
              ))}
            </div>
          )}

          <GrowthVsDistractionChart data={data.growth_vs_distraction} />

          <AchievementsSection achievements={data.achievements} />
        </>
      )}

      {showCreate && <CreateQuestModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

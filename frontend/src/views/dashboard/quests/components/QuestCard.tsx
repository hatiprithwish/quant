import { useNavigate } from "react-router-dom";
import type { QuestSummary } from "@/schemas";
import { questCategoryIcon, questStatusLabel, QuestStatusEnum } from "@/schemas";

function fmtMins(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function ProgressRing({ pct, color, size = 52 }: { pct: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5} className="dark:stroke-gray-700" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill={color}>
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

const STATUS_STYLE: Record<QuestStatusEnum, string> = {
  [QuestStatusEnum.Active]: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  [QuestStatusEnum.Paused]: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  [QuestStatusEnum.Blocked]: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  [QuestStatusEnum.Done]: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

interface Props {
  quest: QuestSummary;
}

export default function QuestCard({ quest }: Props) {
  const navigate = useNavigate();
  const taskPct = quest.task_total > 0 ? (quest.task_done / quest.task_total) * 100 : 0;
  const xpPct = quest.xp_max > 0 ? Math.min((quest.total_xp / quest.xp_max) * 100, 100) : 0;

  return (
    <div
      onClick={() => navigate(`/quests/${quest.id}`)}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: quest.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-gray-400 dark:text-gray-500 text-xs">{questCategoryIcon[quest.category]}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{quest.category}</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {quest.name}
              </h3>
            </div>
            <ProgressRing pct={taskPct} color={quest.color} />
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[quest.status]}`}>
              {questStatusLabel[quest.status]}
            </span>
            {quest.streak > 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">🔥 {quest.streak}d</span>
            )}
            {quest.time_this_week_minutes > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{fmtMins(quest.time_this_week_minutes)} this week</span>
            )}
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400 dark:text-gray-500">XP</span>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{quest.total_xp} / {quest.xp_max}</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${xpPct}%`, backgroundColor: quest.color }}
              />
            </div>
          </div>

          {quest.next_milestone && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              <span className="text-gray-400 dark:text-gray-600">Next: </span>
              {quest.next_milestone}
              {quest.next_milestone_due && (
                <span className="ml-1 text-gray-400 dark:text-gray-600">· {quest.next_milestone_due}</span>
              )}
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>{quest.task_done}/{quest.task_total} tasks</span>
            <span>{quest.milestone_done}/{quest.milestone_total} milestones</span>
          </div>
        </div>
      </div>
    </div>
  );
}

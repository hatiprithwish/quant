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
  questStatusLabel,
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
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={6} className="dark:stroke-gray-700" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill={color}>
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

const MILESTONE_STYLE: Record<MilestoneStatusEnum, { dot: string; line: string }> = {
  [MilestoneStatusEnum.Done]: { dot: "bg-emerald-500", line: "bg-emerald-200 dark:bg-emerald-800" },
  [MilestoneStatusEnum.Active]: { dot: "bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900", line: "bg-gray-200 dark:bg-gray-700" },
  [MilestoneStatusEnum.Pending]: { dot: "bg-gray-300 dark:bg-gray-600", line: "bg-gray-200 dark:bg-gray-700" },
};

const TASK_ICON: Record<TaskStatusEnum, string> = {
  [TaskStatusEnum.Todo]: "○",
  [TaskStatusEnum.Doing]: "◑",
  [TaskStatusEnum.Done]: "●",
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
    return <div className="flex items-center justify-center py-16"><Spinner /></div>;
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
        Failed to load quest.
      </div>
    );
  }

  const { quest, milestones, tasks, time_by_day, growth_vs_distraction } = data;
  const taskPct = quest.task_total > 0 ? (quest.task_done / quest.task_total) * 100 : 0;
  const xpPct = quest.xp_max > 0 ? Math.min((quest.total_xp / quest.xp_max) * 100, 100) : 0;

  const activeMilestone = milestones.find(m => m.status === MilestoneStatusEnum.Active);
  const activeMilestoneTasks = activeMilestone
    ? tasks.filter(t => t.milestone_id === activeMilestone.id)
    : tasks.filter(t => t.milestone_id === null);

  function submitTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    const input: CreateTaskInput = {
      name: newTaskName.trim(),
      milestone_id: activeMilestone?.id,
    };
    createTask.mutate(input, {
      onSuccess: () => { setNewTaskName(""); setAddingTask(false); },
    });
  }

  function submitMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!newMilestoneName.trim()) return;
    const input: CreateMilestoneInput = { name: newMilestoneName.trim() };
    createMilestone.mutate(input, {
      onSuccess: () => { setNewMilestoneName(""); setAddingMilestone(false); },
    });
  }

  const chartData = time_by_day.map(d => ({
    date: d.date.slice(5),
    hours: +(d.minutes / 60).toFixed(1),
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
        <button onClick={() => navigate("/quests")} className="hover:text-indigo-500 transition-colors">Quests</button>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium truncate">{quest.name}</span>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <ProgressRing pct={taskPct} color={quest.color} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs text-gray-400 dark:text-gray-500">{questCategoryIcon[quest.category]} {quest.category}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[quest.status]}`}>
                {questStatusLabel[quest.status]}
              </span>
              {quest.streak > 0 && <span className="text-xs text-amber-600 dark:text-amber-400">🔥 {quest.streak}d streak</span>}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{quest.name}</h2>
            {quest.description && <p className="text-sm text-gray-500 dark:text-gray-400">{quest.description}</p>}
            <div className="flex items-center gap-4 mt-3 flex-wrap text-sm">
              <div>
                <span className="text-gray-400 dark:text-gray-500">XP </span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{quest.total_xp} / {quest.xp_max}</span>
              </div>
              <div>
                <span className="text-gray-400 dark:text-gray-500">Time </span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{fmtMins(quest.time_this_week_minutes)} this week</span>
              </div>
              {quest.deadline && (
                <div>
                  <span className="text-gray-400 dark:text-gray-500">Due </span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{quest.deadline}</span>
                </div>
              )}
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden w-48">
              <div className="h-full rounded-full transition-all" style={{ width: `${xpPct}%`, backgroundColor: quest.color }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Milestones</span>
            <button
              onClick={() => setAddingMilestone(v => !v)}
              className="text-xs text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
            >+ Add</button>
          </div>
          {addingMilestone && (
            <form onSubmit={submitMilestone} className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex gap-2">
              <input
                autoFocus
                value={newMilestoneName}
                onChange={e => setNewMilestoneName(e.target.value)}
                placeholder="Milestone name"
                className="flex-1 text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-400"
              />
              <button type="submit" disabled={createMilestone.isPending} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-500 disabled:opacity-50">Add</button>
            </form>
          )}
          <div className="p-4 space-y-0">
            {milestones.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No milestones yet</p>
            ) : (
              milestones.map((m, i) => {
                const style = MILESTONE_STYLE[m.status];
                return (
                  <div key={m.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full shrink-0 mt-0.5 ${style.dot}`} />
                      {i < milestones.length - 1 && <div className={`w-0.5 flex-1 my-1 ${style.line}`} />}
                    </div>
                    <div className="pb-4 min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <span className={`text-xs font-medium ${m.status === MilestoneStatusEnum.Done ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"}`}>
                          {m.name}
                        </span>
                        <span className="text-xs text-amber-500 shrink-0 font-medium">+{m.xp_reward}xp</span>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {m.task_done}/{m.task_total} tasks{m.due_date && ` · ${m.due_date}`}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {activeMilestone ? activeMilestone.name : "Tasks"}
            </span>
            <button
              onClick={() => setAddingTask(v => !v)}
              className="text-xs text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
            >+ Add</button>
          </div>
          {addingTask && (
            <form onSubmit={submitTask} className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex gap-2">
              <input
                autoFocus
                value={newTaskName}
                onChange={e => setNewTaskName(e.target.value)}
                placeholder="Task name"
                className="flex-1 text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-400"
              />
              <button type="submit" disabled={createTask.isPending} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-500 disabled:opacity-50">Add</button>
            </form>
          )}
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {activeMilestoneTasks.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">No tasks</p>
            ) : (
              activeMilestoneTasks.map(t => {
                const nextStatus = t.status === TaskStatusEnum.Todo
                  ? TaskStatusEnum.Doing
                  : t.status === TaskStatusEnum.Doing
                  ? TaskStatusEnum.Done
                  : null;
                return (
                  <div key={t.id} className="px-4 py-2.5 flex items-center gap-2.5">
                    <button
                      onClick={() => nextStatus && updateStatus.mutate({ taskId: t.id, status: nextStatus })}
                      disabled={!nextStatus || updateStatus.isPending}
                      className={`text-base shrink-0 transition-colors ${
                        t.status === TaskStatusEnum.Done
                          ? "text-emerald-500"
                          : t.status === TaskStatusEnum.Doing
                          ? "text-indigo-500"
                          : "text-gray-300 dark:text-gray-600 hover:text-indigo-400"
                      }`}
                    >
                      {TASK_ICON[t.status]}
                    </button>
                    <span className={`flex-1 text-sm ${t.status === TaskStatusEnum.Done ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"}`}>
                      {t.name}
                    </span>
                    {t.xp_reward > 0 && (
                      <span className="text-xs text-amber-500 font-medium">+{t.xp_reward}xp</span>
                    )}
                    {t.due_date && <span className="text-xs text-gray-300 dark:text-gray-600">{t.due_date.slice(5)}</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          {chartData.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Time (last 14 days)</div>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={chartData} barSize={8}>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} unit="h" width={24} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} formatter={v => [`${v}h`, "Time"]} />
                  <Bar dataKey="hours" fill={quest.color} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Focus</div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{+(growth_vs_distraction.growth_minutes / 60).toFixed(1)}h growth</span>
              <span>/</span>
              <span className="text-red-500 dark:text-red-400">{+(growth_vs_distraction.distraction_minutes / 60).toFixed(1)}h dist.</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
              {(() => {
                const total = growth_vs_distraction.growth_minutes + growth_vs_distraction.distraction_minutes;
                const pct = total > 0 ? (growth_vs_distraction.growth_minutes / total) * 100 : 0;
                return (
                  <>
                    <div className="h-full bg-emerald-400" style={{ width: `${pct}%` }} />
                    <div className="h-full bg-red-400" style={{ width: `${100 - pct}%` }} />
                  </>
                );
              })()}
            </div>
          </div>

          {data.recent_xp_events.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-400">
                Recent XP
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {data.recent_xp_events.slice(0, 6).map(e => (
                  <div key={e.id} className="px-4 py-2 flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">{e.source_type.replace(/_/g, " ")}</span>
                    <span className="font-semibold text-amber-500">+{e.xp} xp</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

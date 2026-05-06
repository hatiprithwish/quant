import { Link } from "react-router-dom";
import { useGetQuestsKanban } from "@/api/cachedQueries";
import { useMutationUpdateTaskStatus } from "@/api/mutations";
import { TaskStatusEnum, questCategoryIcon } from "@/schemas";
import type { KanbanTask } from "@/schemas";

function TaskCard({ task }: { task: KanbanTask }) {
  const update = useMutationUpdateTaskStatus();

  const nextStatus =
    task.status === TaskStatusEnum.Todo
      ? TaskStatusEnum.Doing
      : task.status === TaskStatusEnum.Doing
      ? TaskStatusEnum.Done
      : null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex gap-2.5 hover:shadow-sm transition-shadow">
      <div className="w-1 rounded-full self-stretch flex-shrink-0" style={{ backgroundColor: task.quest_color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-gray-300 dark:text-gray-600 text-xs">{questCategoryIcon[task.quest_category as keyof typeof questCategoryIcon] ?? "◆"}</span>
          <Link
            to={`/quests/${task.quest_id}`}
            onClick={e => e.stopPropagation()}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors truncate"
          >
            {task.quest_name}
          </Link>
        </div>
        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-snug">{task.name}</p>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-2">
            {task.due_date && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{task.due_date.slice(5)}</span>
            )}
            {task.xp_reward > 0 && (
              <span className="text-xs text-amber-500 font-medium">+{task.xp_reward}xp</span>
            )}
          </div>
          {nextStatus && (
            <button
              onClick={() => update.mutate({ taskId: task.id, status: nextStatus })}
              disabled={update.isPending}
              className="text-xs text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 transition-colors"
            >
              {nextStatus === TaskStatusEnum.Doing ? "Start →" : "Done ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Column({ title, tasks, accent }: { title: string; tasks: KanbanTask[]; accent: string }) {
  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${accent}`} />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-2 flex-1">
        {tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 py-8 text-center text-xs text-gray-400 dark:text-gray-500">
            Empty
          </div>
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
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Kanban Board</h2>
          <Link
            to="/quests"
            className="px-2.5 py-1 rounded-md text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">Loading…</div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          Failed to load board.
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Column title="Todo" tasks={data.todo} accent="bg-gray-400" />
          <Column title="In Progress" tasks={data.doing} accent="bg-indigo-500" />
          <Column title="Done" tasks={data.done} accent="bg-emerald-500" />
        </div>
      )}
    </div>
  );
}

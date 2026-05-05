import type { AchievementItem } from "@/schemas";

interface Props {
  achievements: AchievementItem[];
}

export default function AchievementsSection({ achievements }: Props) {
  if (achievements.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Achievements</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {achievements.map(a => (
          <div
            key={a.key}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-start gap-3"
          >
            <span className="text-2xl">{a.icon}</span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{a.title}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">{a.description}</div>
              <div className="text-xs text-gray-300 dark:text-gray-600 mt-1">{a.unlocked_at.slice(0, 10)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

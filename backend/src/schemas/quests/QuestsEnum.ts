import { z } from "zod";

export enum QuestStatusEnum {
  Active = "active",
  Paused = "paused",
  Blocked = "blocked",
  Done = "done",
}
export const ZQuestStatusEnum = z.nativeEnum(QuestStatusEnum);

export enum QuestCategoryEnum {
  Skill = "skill",
  Hobby = "hobby",
  Health = "health",
  Creative = "creative",
  Life = "life",
  Career = "career",
}
export const ZQuestCategoryEnum = z.nativeEnum(QuestCategoryEnum);

export enum MilestoneStatusEnum {
  Pending = "pending",
  Active = "active",
  Done = "done",
}
export const ZMilestoneStatusEnum = z.nativeEnum(MilestoneStatusEnum);

export enum TaskStatusEnum {
  Todo = "todo",
  Doing = "doing",
  Done = "done",
}
export const ZTaskStatusEnum = z.nativeEnum(TaskStatusEnum);

export enum XpSourceTypeEnum {
  TaskCompleted = "task_completed",
  MilestoneCompleted = "milestone_completed",
  TimeLogged = "time_logged",
  DailyStreak = "daily_streak",
}
export const ZXpSourceTypeEnum = z.nativeEnum(XpSourceTypeEnum);

// XP required to reach each level (cumulative total)
export const XP_LEVEL_THRESHOLDS = [0, 500, 1200, 2500, 4500, 7000, 10000, 14000, 19000, 25000];

export function xpToLevel(totalXp: number): number {
  let level = 1;
  for (let i = XP_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= XP_LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function xpForNextLevel(totalXp: number): { current: number; needed: number; nextAt: number } {
  const level = xpToLevel(totalXp);
  const currentLevelXp = XP_LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelXp = XP_LEVEL_THRESHOLDS[level] ?? XP_LEVEL_THRESHOLDS[XP_LEVEL_THRESHOLDS.length - 1];
  return {
    current: totalXp - currentLevelXp,
    needed: nextLevelXp - currentLevelXp,
    nextAt: nextLevelXp,
  };
}

export const LEVEL_TITLES: Record<number, string> = {
  1: "Initiate",
  2: "Apprentice",
  3: "Journeyman",
  4: "Adept",
  5: "Expert",
  6: "Master",
  7: "Architect",
  8: "Grandmaster",
  9: "Legend",
  10: "Ascendant",
};

export const ACHIEVEMENT_KEYS = {
  FIRST_QUEST: "first_quest",
  FIRST_TASK: "first_task",
  STREAK_7: "streak_7",
  STREAK_14: "streak_14",
  STREAK_30: "streak_30",
  MILESTONE_5: "milestone_5",
  QUEST_COMPLETE: "quest_complete",
} as const;

export const ACHIEVEMENT_LABELS: Record<string, { title: string; description: string; icon: string }> = {
  first_quest: { title: "Quest Begun", description: "Created your first quest", icon: "⚔️" },
  first_task: { title: "First Step", description: "Completed your first task", icon: "✅" },
  streak_7: { title: "Week Warrior", description: "7-day streak", icon: "🔥" },
  streak_14: { title: "Fortnight Focus", description: "14-day streak", icon: "💪" },
  streak_30: { title: "Iron Will", description: "30-day streak", icon: "🏆" },
  milestone_5: { title: "Milestone Master", description: "Completed 5 milestones", icon: "🎯" },
  quest_complete: { title: "Quest Complete", description: "Finished a quest", icon: "🌟" },
};

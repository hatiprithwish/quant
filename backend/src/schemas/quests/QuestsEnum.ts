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
  Achievement = "achievement",
  CheckIn = "checkin",
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

export enum TrajectoryPhaseEnum {
  FiveYear = "five_year",
  ThreeYear = "three_year",
  OneYear = "one_year",
  Quarterly = "quarterly",
  Weekly = "weekly",
  Standalone = "standalone",
}
export const ZTrajectoryPhaseEnum = z.nativeEnum(TrajectoryPhaseEnum);

export enum TaskPhaseTagEnum {
  CriticalPath = "critical_path",
  Foundation = "foundation",
  Skill = "skill",
  Admin = "admin",
  Elimination = "elimination",
}
export const ZTaskPhaseTagEnum = z.nativeEnum(TaskPhaseTagEnum);

export enum GoalChangeTypeEnum {
  Pivot = "pivot",
  Panic = "panic",
  Refinement = "refinement",
}
export const ZGoalChangeTypeEnum = z.nativeEnum(GoalChangeTypeEnum);

export enum EliminationResultEnum {
  Stopped = "stopped",
  Partial = "partial",
  Failed = "failed",
}
export const ZEliminationResultEnum = z.nativeEnum(EliminationResultEnum);

export enum WeeklyCheckinStatusEnum {
  Pending = "pending",
  Reviewed = "reviewed",
  Missed = "missed",
}
export const ZWeeklyCheckinStatusEnum = z.nativeEnum(WeeklyCheckinStatusEnum);

export const ACHIEVEMENT_KEYS = {
  FIRST_QUEST: "first_quest",
  FIRST_TASK: "first_task",
  STREAK_7: "streak_7",
  STREAK_14: "streak_14",
  STREAK_30: "streak_30",
  MILESTONE_5: "milestone_5",
  QUEST_COMPLETE: "quest_complete",
  // Trajectory achievements
  VAULT_COMPLETE: "vault_complete",
  FIRST_CHECKIN: "first_checkin",
  CHECKIN_STREAK_4: "checkin_streak_4",
  WEEKLY_SCORE_70: "weekly_score_70",
  WEEKLY_SCORE_90: "weekly_score_90",
  Q_MILESTONE_DONE: "q_milestone_done",
  YEAR_MILESTONE_DONE: "year_milestone_done",
  STABILITY_QUARTER: "stability_quarter",
  STREAK_4_WEEKS_70: "streak_4_weeks_70",
  // Cross-module achievements
  FULL_ALIGNMENT_WEEK: "full_alignment_week",
  FINANCIAL_DISCIPLINE_4W: "financial_discipline_4w",
  DEEP_WORK_WEEK: "deep_work_week",
  HEALTH_AND_HUSTLE: "health_and_hustle",
  ESCAPE_10PCT: "escape_10pct",
  ESCAPE_25PCT: "escape_25pct",
  ESCAPE_50PCT: "escape_50pct",
  INCOME_DOUBLED: "income_doubled",
  INCOME_5X: "income_5x",
  FIRST_PAYING_CUSTOMER: "first_paying_customer",
  ZERO_JUNK_WEEK: "zero_junk_week",
  ZERO_DISTRACTION_WEEK: "zero_distraction_week",
  NO_IMPULSE_MONTH: "no_impulse_month",
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

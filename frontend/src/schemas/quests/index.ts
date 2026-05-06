import { ApiResponse } from "../common";

export enum QuestStatusEnum {
  Active = "active",
  Paused = "paused",
  Blocked = "blocked",
  Done = "done",
}

export enum QuestCategoryEnum {
  Skill = "skill",
  Hobby = "hobby",
  Health = "health",
  Creative = "creative",
  Life = "life",
  Career = "career",
}

export enum MilestoneStatusEnum {
  Pending = "pending",
  Active = "active",
  Done = "done",
}

export enum TaskStatusEnum {
  Todo = "todo",
  Doing = "doing",
  Done = "done",
}

export const questCategoryLabel: Record<QuestCategoryEnum, string> = {
  [QuestCategoryEnum.Skill]: "Skill",
  [QuestCategoryEnum.Hobby]: "Hobby",
  [QuestCategoryEnum.Health]: "Health",
  [QuestCategoryEnum.Creative]: "Creative",
  [QuestCategoryEnum.Life]: "Life",
  [QuestCategoryEnum.Career]: "Career",
};

export const questCategoryIcon: Record<QuestCategoryEnum, string> = {
  [QuestCategoryEnum.Skill]: "◆",
  [QuestCategoryEnum.Hobby]: "♪",
  [QuestCategoryEnum.Health]: "◉",
  [QuestCategoryEnum.Creative]: "✎",
  [QuestCategoryEnum.Life]: "⌂",
  [QuestCategoryEnum.Career]: "▲",
};

export const questStatusLabel: Record<QuestStatusEnum, string> = {
  [QuestStatusEnum.Active]: "Active",
  [QuestStatusEnum.Paused]: "Paused",
  [QuestStatusEnum.Blocked]: "Blocked",
  [QuestStatusEnum.Done]: "Done",
};

// ── Shared interfaces ────────────────────────────────────────────────────────

export interface QuestSummary {
  id: string;
  name: string;
  description: string | null;
  category: QuestCategoryEnum;
  color: string;
  status: QuestStatusEnum;
  deadline: string | null;
  task_done: number;
  task_total: number;
  milestone_done: number;
  milestone_total: number;
  total_xp: number;
  xp_max: number;
  streak: number;
  next_milestone: string | null;
  next_milestone_due: string | null;
  time_this_week_minutes: number;
  created_at: string;
}

export interface QuestMilestoneSummary {
  id: number;
  name: string;
  xp_reward: number;
  order: number;
  status: MilestoneStatusEnum;
  due_date: string | null;
  task_done: number;
  task_total: number;
}

export interface QuestTaskItem {
  id: number;
  quest_id: string;
  milestone_id: number | null;
  name: string;
  status: TaskStatusEnum;
  xp_reward: number;
  due_date: string | null;
  created_at: string;
}

export interface AchievementItem {
  key: string;
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

export interface UserLevelInfo {
  total_xp: number;
  level: number;
  title: string;
  xp_in_level: number;
  xp_for_next: number;
  next_level_at: number;
}

export interface GrowthVsDistraction {
  growth_minutes: number;
  distraction_minutes: number;
  growth_pct: number;
  distraction_pct: number;
}

export interface KanbanTask {
  id: number;
  quest_id: string;
  quest_name: string;
  quest_color: string;
  quest_category: string;
  name: string;
  status: string;
  xp_reward: number;
  due_date: string | null;
}

// ── API Response types ───────────────────────────────────────────────────────

export interface GetQuestsDashboardResponse extends ApiResponse {
  level_info: UserLevelInfo;
  current_streak: number;
  longest_streak: number;
  active_quests_count: number;
  focus_score: number;
  growth_vs_distraction: GrowthVsDistraction;
  quests: QuestSummary[];
  achievements: AchievementItem[];
}

export interface GetQuestDetailResponse extends ApiResponse {
  quest: QuestSummary;
  milestones: QuestMilestoneSummary[];
  tasks: QuestTaskItem[];
  time_by_day: { date: string; minutes: number }[];
  recent_xp_events: { id: number; quest_id: string | null; source_type: string; source_id: number | null; xp: number; occurred_at: string }[];
  growth_vs_distraction: GrowthVsDistraction;
}

export interface GetQuestsKanbanResponse extends ApiResponse {
  todo: KanbanTask[];
  doing: KanbanTask[];
  done: KanbanTask[];
}

export interface CreateQuestResponse extends ApiResponse {
  quest_id: string;
}

export interface UpdateTaskStatusResponse extends ApiResponse {
  xp_awarded: number;
  level_up: boolean;
  new_level: number | null;
  achievement_unlocked: string | null;
}

import { QuestStatusEnum, QuestCategoryEnum, MilestoneStatusEnum, TaskStatusEnum } from "./QuestsEnum";

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

export interface QuestXpEvent {
  id: number;
  quest_id: string | null;
  source_type: string;
  source_id: number | null;
  xp: number;
  occurred_at: string;
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

import { ApiResponse } from "../common";
import {
  QuestSummary,
  QuestMilestoneSummary,
  QuestTaskItem,
  AchievementItem,
  UserLevelInfo,
  QuestXpEvent,
} from "./QuestsCommon";

export interface GrowthVsDistraction {
  growth_minutes: number;
  distraction_minutes: number;
  growth_pct: number;
  distraction_pct: number;
}

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
  recent_xp_events: QuestXpEvent[];
  growth_vs_distraction: GrowthVsDistraction;
}

export interface GetQuestsKanbanResponse extends ApiResponse {
  todo: KanbanTask[];
  doing: KanbanTask[];
  done: KanbanTask[];
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

export interface CreateQuestResponse extends ApiResponse {
  quest_id: string;
}

export interface CreateMilestoneResponse extends ApiResponse {
  milestone_id: number;
}

export interface CreateTaskResponse extends ApiResponse {
  task_id: number;
  xp_awarded: number;
}

export interface UpdateTaskStatusResponse extends ApiResponse {
  xp_awarded: number;
  level_up: boolean;
  new_level: number | null;
  achievement_unlocked: string | null;
}

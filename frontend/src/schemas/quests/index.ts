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

// ── Trajectory types ──────────────────────────────────────────────────────────

export interface TrajectoryQuestData {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  trajectory_phase: string;
  parent_quest_id: string | null;
  escape_number: number | null;
  color: string;
  status: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrajectoryConfigData {
  id: number;
  user_id: string;
  escape_number: number | null;
  monthly_investment_target: number | null;
  assumed_annual_return_rate: number | null;
  current_monthly_income: number | null;
  income_milestone_year1: number | null;
  income_milestone_year3: number | null;
  checkin_due: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyCheckinData {
  id: number;
  user_id: string;
  week_start: string;
  status: string;
  task_completion_score: number | null;
  elimination_score: number | null;
  decision_alignment_score: number | null;
  confidence_score: number | null;
  weekly_score: number | null;
  ai_analysis: string | null;
  user_corrections: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletionAnalysis {
  score: number;
  total_tasks: number;
  completed_tasks: number;
  critical_path_completed: number;
  critical_path_total: number;
  task_details: Array<{ name: string; status: string; phase_tag: string | null }>;
}

export interface EliminationAnalysis {
  score: number;
  items: Array<{ description: string; result: string; evidence: string; source: "auto" | "manual" }>;
}

export interface DecisionAlignmentAnalysis {
  score: number;
  decisions: Array<{ description: string; alignment: string; source: string; date: string }>;
}

export interface ConfidenceAnalysis {
  score: number;
  basis: string;
  pulse_days_logged: number;
}

export interface WeeklyAnalysisData {
  task_completion: TaskCompletionAnalysis;
  elimination: EliminationAnalysis;
  decision_alignment: DecisionAlignmentAnalysis;
  confidence: ConfidenceAnalysis;
  narrative: string;
}

export interface WeeklyScoreComponents {
  task_completion: number;
  elimination: number;
  decision_alignment: number;
  confidence: number;
  weighted_total: number;
}

export interface ScoreHistoryData {
  id: number;
  user_id: string;
  period_type: string;
  period_start: string;
  score: number;
  component_scores: string | null;
  created_at: string;
}

export interface EliminationItemData {
  id: number;
  user_id: string;
  week_start: string;
  description: string;
  linked_time_bucket_id: number | null;
  linked_money_category_id: number | null;
  linked_food_type: string | null;
  result: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetTrajectoryConfigResponse extends ApiResponse {
  config: TrajectoryConfigData | null;
}

export interface GetVaultResponse extends ApiResponse {
  five_year: TrajectoryQuestData[];
  three_year: TrajectoryQuestData[];
  one_year: TrajectoryQuestData[];
  quarterly: TrajectoryQuestData[];
  weekly: TrajectoryQuestData[];
  quarterly_active_count: number;
  quarterly_max: number;
}

export interface GetTrajectoryDashboardResponse extends ApiResponse {
  current_week: WeeklyCheckinData | null;
  score_components: WeeklyScoreComponents | null;
  drift_status: string;
  drift_score: number | null;
  recent_scores: ScoreHistoryData[];
  escape_number: number | null;
  current_invested_capital: number | null;
  projected_arrival_date: string | null;
  income_gap_warning: boolean;
  income_gap_amount: number | null;
}

export interface GetWeeklyCheckinResponse extends ApiResponse {
  checkin: WeeklyCheckinData | null;
  analysis: WeeklyAnalysisData | null;
}

export interface GetCheckinHistoryResponse extends ApiResponse {
  checkins: WeeklyCheckinData[];
}

export interface GetEliminationItemsResponse extends ApiResponse {
  items: EliminationItemData[];
}

export interface CreateGoalChangeResponse extends ApiResponse {
  change_request: {
    id: number;
    user_id: string;
    quest_id: string;
    change_type: string;
    reason: string;
    xp_penalty: number;
    cooling_off_until: string;
    confirmed_at: string | null;
    cancelled_at: string | null;
    created_at: string;
  } | null;
  cooling_off_until: string | null;
  xp_penalty: number;
}

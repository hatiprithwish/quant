import { TrajectoryPhaseEnum, WeeklyCheckinStatusEnum, EliminationResultEnum, GoalChangeTypeEnum } from "./TrajectoryEnum";

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

export interface TrajectoryQuestData {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  trajectory_phase: TrajectoryPhaseEnum;
  parent_quest_id: string | null;
  escape_number: number | null;
  color: string;
  status: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyCheckinData {
  id: number;
  user_id: string;
  week_start: string;
  status: WeeklyCheckinStatusEnum;
  task_completion_score: number | null;
  elimination_score: number | null;
  decision_alignment_score: number | null;
  confidence_score: number | null;
  weekly_score: number | null;
  ai_analysis: string | null;
  user_corrections: string | null;
  ai_model_version: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EliminationItemData {
  id: number;
  user_id: string;
  week_start: string;
  description: string;
  linked_time_bucket_id: number | null;
  linked_money_category_id: number | null;
  linked_food_type: string | null;
  result: EliminationResultEnum | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalChangeRequestData {
  id: number;
  user_id: string;
  quest_id: string;
  change_type: GoalChangeTypeEnum;
  reason: string;
  old_description: string | null;
  new_description: string | null;
  xp_penalty: number;
  cooling_off_until: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
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

export interface WeeklyScoreComponents {
  task_completion: number;
  elimination: number;
  decision_alignment: number;
  confidence: number;
  weighted_total: number;
}

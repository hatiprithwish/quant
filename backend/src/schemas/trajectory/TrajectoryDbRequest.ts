import { TrajectoryPhaseEnum, GoalChangeTypeEnum, EliminationResultEnum, WeeklyCheckinStatusEnum, TaskPhaseTagEnum } from "./TrajectoryEnum";

export interface UpsertTrajectoryConfigDbRequest {
  userId: string;
  escape_number?: number;
  monthly_investment_target?: number;
  assumed_annual_return_rate?: number;
  current_monthly_income?: number;
  income_milestone_year1?: number;
  income_milestone_year3?: number;
}

export interface GetVaultQuestsDbRequest {
  userId: string;
  phase?: TrajectoryPhaseEnum;
}

export interface CreateTrajectoryQuestDbRequest {
  id: string;
  userId: string;
  name: string;
  description?: string;
  trajectory_phase: TrajectoryPhaseEnum;
  parent_quest_id?: string;
  color: string;
  deadline?: string;
  escape_number?: number;
}

export interface UpdateTrajectoryQuestDbRequest {
  questId: string;
  userId: string;
  name?: string;
  description?: string | null;
  color?: string;
  deadline?: string | null;
  escape_number?: number | null;
  parent_quest_id?: string | null;
}

export interface GetActiveQuarterlyCountDbRequest {
  userId: string;
  quarter_start: string;
}

export interface CreateGoalChangeRequestDbRequest {
  userId: string;
  quest_id: string;
  change_type: GoalChangeTypeEnum;
  reason: string;
  old_description?: string;
  new_description?: string;
  xp_penalty: number;
  cooling_off_until: string;
}

export interface GetGoalChangeRequestDbRequest {
  changeRequestId: number;
  userId: string;
}

export interface CreateEliminationItemDbRequest {
  userId: string;
  week_start: string;
  description: string;
  linked_time_bucket_id?: number;
  linked_money_category_id?: number;
  linked_food_type?: string;
}

export interface UpdateEliminationItemDbRequest {
  itemId: number;
  userId: string;
  result?: EliminationResultEnum;
  notes?: string | null;
}

export interface GetEliminationItemsDbRequest {
  userId: string;
  week_start: string;
}

export interface UpsertWeeklyCheckinDbRequest {
  userId: string;
  week_start: string;
  task_completion_score?: number;
  elimination_score?: number;
  decision_alignment_score?: number;
  confidence_score?: number;
  weekly_score?: number;
  ai_analysis?: string;
  user_corrections?: string;
  ai_model_version?: string;
  status?: WeeklyCheckinStatusEnum;
  reviewed_at?: string;
}

export interface GetWeeklyCheckinDbRequest {
  userId: string;
  week_start: string;
}

export interface GetCheckinHistoryDbRequest {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface InsertScoreHistoryDbRequest {
  userId: string;
  period_type: string;
  period_start: string;
  score: number;
  component_scores?: string;
}

export interface GetScoreHistoryDbRequest {
  userId: string;
  period_type: string;
  limit?: number;
}

export interface UpdateTaskPhaseTagDbRequest {
  taskId: number;
  userId: string;
  phase_tag: TaskPhaseTagEnum | null;
}

export interface InsertDecisionLogDbRequest {
  userId: string;
  week_start: string;
  description: string;
  alignment: string;
  related_quest_id?: string;
  source: string;
}

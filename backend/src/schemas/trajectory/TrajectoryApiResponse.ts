import { ApiResponse } from "../common";
import {
  TrajectoryConfigData,
  TrajectoryQuestData,
  WeeklyCheckinData,
  EliminationItemData,
  GoalChangeRequestData,
  ScoreHistoryData,
  WeeklyScoreComponents,
} from "./TrajectoryCommon";

export interface GetTrajectoryConfigResponse extends ApiResponse {
  config: TrajectoryConfigData | null;
}

export interface GetVaultResponse extends ApiResponse {
  // Quests grouped by trajectory_phase
  five_year: TrajectoryQuestData[];
  three_year: TrajectoryQuestData[];
  one_year: TrajectoryQuestData[];
  quarterly: TrajectoryQuestData[];
  weekly: TrajectoryQuestData[];
  // Quarterly cap status
  quarterly_active_count: number;
  quarterly_max: number;
}

export interface GetTrajectoryDashboardResponse extends ApiResponse {
  // Current week score ring
  current_week: WeeklyCheckinData | null;
  score_components: WeeklyScoreComponents | null;
  // Drift status: 'on_track' | 'drifting' | 'misaligned'
  drift_status: string;
  drift_score: number | null;
  // 4-week score history for sparkline
  recent_scores: ScoreHistoryData[];
  // Escape number progress
  escape_number: number | null;
  current_invested_capital: number | null;
  projected_arrival_date: string | null;
  // Income warning active?
  income_gap_warning: boolean;
  income_gap_amount: number | null;
}

export interface GetWeeklyCheckinResponse extends ApiResponse {
  checkin: WeeklyCheckinData | null;
  // Parsed ai_analysis JSON
  analysis: WeeklyAnalysisData | null;
}

export interface WeeklyAnalysisData {
  task_completion: TaskCompletionAnalysis;
  elimination: EliminationAnalysis;
  decision_alignment: DecisionAlignmentAnalysis;
  confidence: ConfidenceAnalysis;
  narrative: string;
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
  items: Array<{
    description: string;
    result: string;
    evidence: string;
    source: "auto" | "manual";
  }>;
}

export interface DecisionAlignmentAnalysis {
  score: number;
  decisions: Array<{
    description: string;
    alignment: string;
    source: string;
    date: string;
  }>;
}

export interface ConfidenceAnalysis {
  score: number;
  basis: string;
  pulse_days_logged: number;
}

export interface GetCheckinHistoryResponse extends ApiResponse {
  checkins: WeeklyCheckinData[];
}

export interface CreateGoalChangeResponse extends ApiResponse {
  change_request: GoalChangeRequestData | null;
  cooling_off_until: string | null;
  xp_penalty: number;
}

export interface GetEliminationItemsResponse extends ApiResponse {
  items: EliminationItemData[];
}

export interface GetScoreHistoryResponse extends ApiResponse {
  scores: ScoreHistoryData[];
}

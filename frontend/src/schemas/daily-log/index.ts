import type { ApiResponse } from "../common";

export interface DailyLogEntry {
  id: number;
  date: string;
  content: string;
  ai_processed: boolean;
  ai_processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetDailyLogResponse extends ApiResponse {
  log: DailyLogEntry | null;
}

export interface SaveDailyLogResponse extends ApiResponse {
  log: DailyLogEntry;
}

export interface ListDailyLogsResponse extends ApiResponse {
  logs: Pick<DailyLogEntry, "id" | "date" | "ai_processed">[];
}

export interface AnalyzeDailyLogResponse extends ApiResponse {
  summary: {
    meals_logged: number;
    expenses_logged: number;
    time_entries_logged: number;
    details: string;
  };
}

export interface WeeklyReviewResponse extends ApiResponse {
  review: {
    wins: string[];
    misses: string[];
    recommendations: string[];
    metrics_summary: string;
  };
}

export interface CompareDaysResponse extends ApiResponse {
  comparison: {
    better_areas: string[];
    worse_areas: string[];
    one_percent_suggestions: string[];
    verdict: string;
  };
}

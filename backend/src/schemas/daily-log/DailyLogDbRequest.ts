export interface GetDailyLogDbRequest {
  userId: string;
  date: string;
}

export interface UpsertDailyLogDbRequest {
  userId: string;
  date: string;
  content: string;
}

export interface GetDailyLogsByRangeDbRequest {
  userId: string;
  from: string;
  to: string;
}

export interface MarkAiProcessedDbRequest {
  userId: string;
  date: string;
  ai_processed_at: string;
}

export interface CreateDailyLogForUserDbRequest {
  userId: string;
  date: string;
}

import { ApiResponse } from "../common";

export interface TimeActivity {
  id: number;
  bucket_id: number;
  bucket_name: string;
  bucket_color: string;
  activity: string;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
}

export interface BucketSummary {
  bucket_id: number;
  bucket_name: string;
  bucket_color: string;
  total_minutes: number;
  activities: TimeActivity[];
}

export interface DayTimeSummary {
  date: string;
  total_minutes: number;
  buckets: BucketSummary[];
}

export interface LogTimeResponse extends ApiResponse {
  insertedCount: number;
}

export interface GetTimeSummaryResponse extends ApiResponse {
  days: DayTimeSummary[];
  totalMinutes: number;
  byBucket: { bucket_id: number; bucket_name: string; bucket_color: string; total_minutes: number }[];
}

export interface CreateTimeEntryResponse extends ApiResponse {
  id: number;
}

export interface UpdateTimeEntryResponse extends ApiResponse {}

export interface DeleteTimeEntryResponse extends ApiResponse {}

export interface GetBucketEntriesResponse extends ApiResponse {
  entries: TimeActivity[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

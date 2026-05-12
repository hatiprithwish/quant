import { ApiResponse } from "../common";

export interface TimeBucketItem {
  id: number;
  name: string;
  color: string;
  is_distraction: boolean;
  is_archived: boolean;
  quest_id: string | null;
  quest_name: string | null;
}

export interface GetTimeBucketsResponse extends ApiResponse {
  buckets: TimeBucketItem[];
}

export interface TimeActivity {
  id: number;
  date: string;
  bucket_id: number;
  bucket_name: string;
  bucket_color: string;
  activity: string;
  start_time: string;
  end_time: string;
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

export interface GetTimeSummaryResponse extends ApiResponse {
  days: DayTimeSummary[];
  totalMinutes: number;
  byBucket: { bucket_id: number; bucket_name: string; bucket_color: string; total_minutes: number }[];
}

export interface GetBucketEntriesResponse extends ApiResponse {
  entries: TimeActivity[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

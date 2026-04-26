import { ApiResponse } from "../common";
import { TimeBucketLabelEnum } from "./TimeEnum";

export interface TimeActivity {
  id: number;
  date: string;
  bucket: TimeBucketLabelEnum;
  activity: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

export interface BucketSummary {
  bucket: TimeBucketLabelEnum;
  total_minutes: number;
  activities: TimeActivity[];
}

export interface DayTimeSummary {
  date: string;
  total_minutes: number;
  buckets: BucketSummary[];
}

export interface LogTimeResponse extends ApiResponse {
  id: number;
}

export interface GetTimeSummaryResponse extends ApiResponse {
  days: DayTimeSummary[];
  totalMinutes: number;
  byBucket: { bucket: TimeBucketLabelEnum; total_minutes: number }[];
}

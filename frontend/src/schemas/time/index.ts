import { ApiResponse } from "../common";

export enum TimeBucketLabelEnum {
  Career = "career",
  Sleep = "sleep",
  Maintenance = "maintenance",
  Fitness = "fitness",
  Learning = "learning",
  Social = "social",
  Entertainment = "entertainment",
  PersonalDev = "personal-dev",
}

export const timeBucketDisplayLabel: Record<TimeBucketLabelEnum, string> = {
  [TimeBucketLabelEnum.Career]: "Career",
  [TimeBucketLabelEnum.Sleep]: "Sleep",
  [TimeBucketLabelEnum.Maintenance]: "Maintenance",
  [TimeBucketLabelEnum.Fitness]: "Fitness",
  [TimeBucketLabelEnum.Learning]: "Learning",
  [TimeBucketLabelEnum.Social]: "Social",
  [TimeBucketLabelEnum.Entertainment]: "Entertainment",
  [TimeBucketLabelEnum.PersonalDev]: "Personal Dev",
};

export const timeBucketColor: Record<TimeBucketLabelEnum, string> = {
  [TimeBucketLabelEnum.Career]: "#6366f1",
  [TimeBucketLabelEnum.Sleep]: "#0ea5e9",
  [TimeBucketLabelEnum.Maintenance]: "#94a3b8",
  [TimeBucketLabelEnum.Fitness]: "#10b981",
  [TimeBucketLabelEnum.Learning]: "#f59e0b",
  [TimeBucketLabelEnum.Social]: "#ec4899",
  [TimeBucketLabelEnum.Entertainment]: "#8b5cf6",
  [TimeBucketLabelEnum.PersonalDev]: "#ef4444",
};

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

export interface GetTimeSummaryResponse extends ApiResponse {
  days: DayTimeSummary[];
  totalMinutes: number;
  byBucket: { bucket: TimeBucketLabelEnum; total_minutes: number }[];
}

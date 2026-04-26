import { TimeBucketIntEnum } from "./TimeEnum";

export interface InsertTimeLogDbRequest {
  userId: string;
  date: string;
  bucket: TimeBucketIntEnum;
  activity: string;
  startTime: string;
  endTime: string;
}

export interface GetTimeLogsDbRequest {
  userId: string;
  from: string;
  to: string;
  bucket: TimeBucketIntEnum | null;
}

export interface InsertTimeLogDbRequest {
  userId: string;
  date: string;
  bucket_id: number;
  activity: string;
  startTime: string;
  endTime: string;
}

export interface GetTimeLogsDbRequest {
  userId: string;
  from: string;
  to: string;
  bucket_id: number | null;
}

export interface UpdateTimeLogDbRequest {
  id: number;
  userId: string;
  bucket_id?: number;
  activity?: string;
  start_time?: string;
  end_time?: string;
}

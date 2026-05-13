export interface InsertTimeLogDbRequest {
  userId: string;
  bucket_id: number;
  activity: string;
  started_at: string;
  ended_at: string;
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
  started_at?: string;
  ended_at?: string;
}

export interface GetBucketEntriesDbRequest {
  userId: string;
  bucket_id: number;
  search: string | null;
  page: number;
  page_size: number;
}

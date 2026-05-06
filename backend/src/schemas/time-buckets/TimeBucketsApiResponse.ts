import { ApiResponse } from "../common";

export interface TimeBucketItem {
  id: number;
  name: string;
  color: string;
  is_distraction: boolean;
  quest_id: string | null;
  quest_name: string | null;
}

export interface GetTimeBucketsResponse extends ApiResponse {
  buckets: TimeBucketItem[];
}

export interface CreateTimeBucketResponse extends ApiResponse {
  bucket_id: number;
}

export interface UpdateTimeBucketResponse extends ApiResponse {
  isSuccess: boolean;
}

export interface DeleteTimeBucketResponse extends ApiResponse {
  isSuccess: boolean;
}

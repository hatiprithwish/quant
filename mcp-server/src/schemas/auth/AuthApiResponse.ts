import { ApiResponse } from "../common";

export interface AuthSyncResponse extends ApiResponse {
  apiKey: string;
  userId: string;
}

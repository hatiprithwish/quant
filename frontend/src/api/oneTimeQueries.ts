import { apiClient } from "./apiClient";

export interface AuthSyncResponse {
  isSuccess: boolean;
  message: string;
  apiKey: string;
  userId: string;
}

export async function syncUser(email: string): Promise<AuthSyncResponse> {
  return apiClient.post<AuthSyncResponse>("/api/auth/sync", { email });
}

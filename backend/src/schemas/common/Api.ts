export interface ApiResponse {
  isSuccess: boolean;
  message: string;
}

export interface ApiErrorResponse extends ApiResponse {
  isSuccess: false;
  errors?: Record<string, string[]>;
}

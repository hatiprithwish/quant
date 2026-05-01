import type { ApiResponse } from "../common";

export interface GetScratchpadResponse extends ApiResponse {
  content: string;
}

export interface SaveScratchpadResponse extends ApiResponse {}

import { z } from "zod";
import { ApiResponse } from "../common";

export const ZSaveScratchpadRequest = z.object({
  content: z.string(),
});
export type SaveScratchpadRequest = z.infer<typeof ZSaveScratchpadRequest>;
export type SaveScratchpadRepoRequest = SaveScratchpadRequest & { userId: string };

export interface GetScratchpadResponse extends ApiResponse {
  content: string;
}

export interface SaveScratchpadResponse extends ApiResponse {}

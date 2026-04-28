import { z } from "zod";

export const ZAuthSyncRequest = z.object({
  email: z.string().email(),
});

export type AuthSyncRequest = z.infer<typeof ZAuthSyncRequest>;

export type AuthSyncRepoRequest = AuthSyncRequest & {
  clerkUserId: string;
};

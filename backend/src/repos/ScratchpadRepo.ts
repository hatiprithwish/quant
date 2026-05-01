import { DrizzleDb } from "../db";
import { ScratchpadDAL } from "../data-access-layer/ScratchpadDAL";
import {
  SaveScratchpadRepoRequest,
  GetScratchpadResponse,
  SaveScratchpadResponse,
} from "../schemas";

export class ScratchpadRepo {
  static async get(userId: string, db: DrizzleDb): Promise<GetScratchpadResponse> {
    const content = await ScratchpadDAL.getByUserId(userId, db);
    return { isSuccess: true, message: "Scratchpad retrieved", content };
  }

  static async save(req: SaveScratchpadRepoRequest, db: DrizzleDb): Promise<SaveScratchpadResponse> {
    await ScratchpadDAL.upsert(req.userId, req.content, db);
    return { isSuccess: true, message: "Scratchpad saved" };
  }
}

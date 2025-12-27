import { Injectable } from "@nestjs/common";
import { deleteAllChatsByUserId, getChatsByUserId } from "../database";

@Injectable()
export class HistoryService {
  async getChats(userId: string, limit: number, startingAfter: string | null, endingBefore: string | null, agentId?: string | null) {
    return getChatsByUserId({
      id: userId,
      limit,
      startingAfter,
      endingBefore,
      agentId,
    });
  }

  async deleteAllChats(userId: string) {
    return deleteAllChatsByUserId({ userId });
  }
}


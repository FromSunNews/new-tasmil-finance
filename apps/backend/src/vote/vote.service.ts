import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { getChatById, getVotesByChatId, voteMessage } from "../database";
import { ChatSDKError } from "../common/errors";

@Injectable()
export class VoteService {
  async getVotes(chatId: string, userId: string) {
    // First check if chatId is valid
    if (!chatId || chatId === 'undefined' || chatId === 'null') {
      return []; // Return empty array for invalid chatId
    }

    const chat = await getChatById({ id: chatId });

    if (!chat) {
      // Instead of throwing error, return empty array for non-existent chat
      // This prevents 404 errors when frontend queries votes for new chats
      return [];
    }

    if (chat.userId !== userId) {
      throw new HttpException(
        new ChatSDKError("forbidden:vote"),
        HttpStatus.FORBIDDEN
      );
    }

    return getVotesByChatId({ id: chatId });
  }

  async vote(chatId: string, messageId: string, type: "up" | "down", userId: string) {
    const chat = await getChatById({ id: chatId });

    if (!chat) {
      throw new HttpException(
        new ChatSDKError("not_found:vote"),
        HttpStatus.NOT_FOUND
      );
    }

    if (chat.userId !== userId) {
      throw new HttpException(
        new ChatSDKError("forbidden:vote"),
        HttpStatus.FORBIDDEN
      );
    }

    await voteMessage({ chatId, messageId, type });
    return { success: true };
  }
}


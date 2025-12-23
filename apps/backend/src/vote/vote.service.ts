import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { getChatById, getVotesByChatId, voteMessage } from "@repo/db";
import { ChatSDKError } from "@repo/api";

@Injectable()
export class VoteService {
  async getVotes(chatId: string, userId: string) {
    const chat = await getChatById({ id: chatId });

    if (!chat) {
      throw new HttpException(
        new ChatSDKError("not_found:chat"),
        HttpStatus.NOT_FOUND
      );
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


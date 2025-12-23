import { apiClient } from "./client";

export const voteApi = {
  async getVotes(chatId: string) {
    return apiClient.get(`/api/vote?chatId=${chatId}`);
  },

  async vote(chatId: string, messageId: string, type: "up" | "down") {
    return apiClient.patch("/api/vote", { chatId, messageId, type });
  },
};


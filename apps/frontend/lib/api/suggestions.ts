import { apiClient } from "./client";

export const suggestionsApi = {
  async getSuggestions(documentId: string) {
    return apiClient.get(`/api/suggestions?documentId=${documentId}`);
  },
};


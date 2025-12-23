import { apiClient } from "./client";
import type { ArtifactKind } from "@repo/api";

export const documentApi = {
  async getDocument(id: string) {
    return apiClient.get(`/api/document?id=${id}`);
  },

  async createDocument(id: string, title: string, kind: ArtifactKind, content: string) {
    return apiClient.post(`/api/document?id=${id}`, { title, kind, content });
  },

  async deleteDocument(id: string, timestamp: Date) {
    const timestampStr = timestamp.toISOString();
    return apiClient.delete(`/api/document?id=${id}&timestamp=${timestampStr}`);
  },
};


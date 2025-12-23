import { apiClient } from "./client";

export const filesApi = {
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.postFormData("/api/files/upload", formData);
  },
};


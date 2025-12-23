import { apiClient } from "./client";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    type: "guest" | "regular";
  };
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/api/auth/login",
      credentials
    );
    if (response.access_token) {
      apiClient.setToken(response.access_token);
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", response.access_token);
      }
    }
    return response;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/api/auth/register",
      credentials
    );
    if (response.access_token) {
      apiClient.setToken(response.access_token);
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", response.access_token);
      }
    }
    return response;
  },

  async guest(): Promise<AuthResponse> {
    const response = await apiClient.get<AuthResponse>("/api/auth/guest");
    if (response.access_token) {
      apiClient.setToken(response.access_token);
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", response.access_token);
      }
    }
    return response;
  },

  async getSession() {
    return apiClient.get<{ user: any }>("/api/auth/session");
  },

  logout() {
    apiClient.setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  },

  init() {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        apiClient.setToken(token);
      }
    }
  },
};

// Initialize on module load
if (typeof window !== "undefined") {
  authApi.init();
}


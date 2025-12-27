// lib/api-client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/use-auth";

// Get API base URL without /api prefix
// Kubb-generated URLs already include /api prefix
const getApiBaseUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9337";
  // Remove /api if it exists, because Kubb-generated URLs already have it
  url = url.replace(/\/api$/, '');
  // Remove trailing slash
  url = url.replace(/\/$/, '');
  return url;
};

const API_BASE_URL = getApiBaseUrl();

console.log('API_BASE_URL configured as:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token as string));
  failedQueue = [];
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

apiClient.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !orig._retry) {
      // Mark this request as retried to prevent infinite loops
      orig._retry = true;
      
      // Clear the auth state
      const { logout } = useAuthStore.getState();
      logout();
      
      // If we're in a browser environment, try to trigger re-authentication
      if (typeof window !== 'undefined') {
        // Dispatch a custom event that the wallet context can listen to
        window.dispatchEvent(new CustomEvent('auth-token-expired'));
      }
      
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Kubb expects a client with getConfig and setConfig methods
type KubbClient = typeof apiClient & {
  getConfig: () => Record<string, unknown>;
  setConfig: (config: Record<string, unknown>) => Record<string, unknown>;
};

const kubbClient = {
  client: Object.assign(apiClient, {
    getConfig: () => ({}),
    setConfig: (config: Record<string, unknown>) => config,
  } as const) as KubbClient,
} as const;

export { kubbClient };
export default apiClient;


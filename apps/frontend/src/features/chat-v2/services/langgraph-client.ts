// 🟢 LangGraph SDK client factory

import { Client } from '@langchain/langgraph-sdk';

let clientInstance: Client | null = null;

export interface LangGraphClientConfig {
  apiUrl: string;
  apiKey?: string;
  defaultHeaders?: Record<string, string>;
}

export function createLangGraphClient(config: LangGraphClientConfig): Client {
  const { apiUrl, apiKey, defaultHeaders = {} } = config;
  
  const headers: Record<string, string> = {
    ...defaultHeaders,
  };
  
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  // Store in singleton so getLangGraphClient can access it
  clientInstance = new Client({
    apiUrl,
    defaultHeaders: headers,
  });

  return clientInstance;
}

export function getLangGraphClient(config?: LangGraphClientConfig): Client {
  if (!clientInstance && config) {
    clientInstance = createLangGraphClient(config);
  }
  
  if (!clientInstance) {
    throw new Error('LangGraph client not initialized. Call createLangGraphClient first.');
  }
  
  return clientInstance;
}

export function resetLangGraphClient(): void {
  clientInstance = null;
}

// Helper to get API URL from environment
export function getApiUrl(): string {
  const url = process.env['NEXT_PUBLIC_API_URL'];
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
  }
  return url;
}

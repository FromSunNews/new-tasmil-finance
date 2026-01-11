"use client";

// 🔌 LangGraph context provider

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import type { Thread, ThreadListParams, ThreadCreateParams } from '@/features/chat-v2/types';
import { threadService, createLangGraphClient } from '@/features/chat-v2/services';

interface LangGraphContextValue {
  // Thread management
  threads: Thread[];
  threadsLoading: boolean;
  currentThread: Thread | null;
  
  // Thread operations
  fetchThreads: (params: ThreadListParams) => Promise<Thread[]>;
  createThread: (params?: ThreadCreateParams) => Promise<Thread | null>;
  selectThread: (threadId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  
  // Client initialization
  isInitialized: boolean;
}

const LangGraphContext = createContext<LangGraphContextValue | undefined>(undefined);

interface LangGraphProviderProps {
  children: ReactNode;
  apiKey?: string;
}

// Track if client has been initialized globally
let clientInitialized = false;

function tryInitializeClient(apiKey?: string): boolean {
  if (clientInitialized) return true;
  
  try {
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'];
    console.log('[LangGraph] Initializing with API URL:', apiUrl);
    
    if (apiUrl) {
      createLangGraphClient({ apiUrl, apiKey });
      clientInitialized = true;
      console.log('[LangGraph] Client initialized successfully');
      return true;
    } else {
      console.warn('[LangGraph] NEXT_PUBLIC_API_URL not set');
      return false;
    }
  } catch (error) {
    console.error('[LangGraph] Failed to initialize client:', error);
    return false;
  }
}

export function LangGraphProvider({ children, apiKey }: LangGraphProviderProps) {
  const [isInitialized, setIsInitialized] = useState(() => tryInitializeClient(apiKey));
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);

  // Retry initialization on mount if not initialized
  useEffect(() => {
    if (!isInitialized) {
      // Small delay to ensure env vars are available
      const timer = setTimeout(() => {
        const result = tryInitializeClient(apiKey);
        if (result) {
          setIsInitialized(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isInitialized, apiKey]);

  const fetchThreads = useCallback(async (params: ThreadListParams): Promise<Thread[]> => {
    if (!isInitialized) return [];
    setThreadsLoading(true);
    try {
      const result = await threadService.getThreads(params);
      setThreads(result);
      return result;
    } finally {
      setThreadsLoading(false);
    }
  }, [isInitialized]);

  const createThread = useCallback(async (params?: ThreadCreateParams): Promise<Thread | null> => {
    if (!isInitialized) {
      console.warn('[LangGraph] Not initialized, skipping thread creation');
      return null;
    }
    try {
      const thread = await threadService.createThread(params);
      if (thread) {
        setThreads(prev => [thread, ...prev]);
        setCurrentThread(thread);
      }
      return thread;
    } catch (error) {
      console.error('[LangGraph] Failed to create thread:', error);
      return null;
    }
  }, [isInitialized]);

  const selectThread = useCallback(async (threadId: string): Promise<void> => {
    if (!isInitialized) return;
    const thread = await threadService.getThread(threadId);
    if (thread) {
      setCurrentThread(thread);
    }
  }, [isInitialized]);

  const deleteThread = useCallback(async (threadId: string): Promise<void> => {
    if (!isInitialized) return;
    await threadService.deleteThread(threadId);
    setThreads(prev => prev.filter(t => t.id !== threadId));
    if (currentThread?.id === threadId) {
      setCurrentThread(null);
    }
  }, [isInitialized, currentThread?.id]);

  const value = useMemo<LangGraphContextValue>(() => ({
    threads,
    threadsLoading,
    currentThread,
    fetchThreads,
    createThread,
    selectThread,
    deleteThread,
    isInitialized,
  }), [
    threads,
    threadsLoading,
    currentThread,
    fetchThreads,
    createThread,
    selectThread,
    deleteThread,
    isInitialized,
  ]);

  return (
    <LangGraphContext.Provider value={value}>
      {children}
    </LangGraphContext.Provider>
  );
}

export function useLangGraph(): LangGraphContextValue {
  const context = useContext(LangGraphContext);
  if (!context) {
    throw new Error('useLangGraph must be used within a LangGraphProvider');
  }
  return context;
}

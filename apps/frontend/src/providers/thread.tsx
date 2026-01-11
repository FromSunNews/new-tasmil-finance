"use client";

import { validate } from "uuid";
import { getApiKey } from "@/lib/api-key";
import { Thread } from "@langchain/langgraph-sdk";
import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useState,
  Dispatch,
  SetStateAction,
  useMemo,
} from "react";
import { createClient } from "@/providers/client";

interface ThreadContextType {
  getThreads: (assistantId: string) => Promise<Thread[]>;
  threads: Thread[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  threadsLoading: boolean;
  setThreadsLoading: Dispatch<SetStateAction<boolean>>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

function getThreadSearchMetadata(
  assistantId: string,
): { graph_id: string } | { assistant_id: string } {
  if (validate(assistantId)) {
    return { assistant_id: assistantId };
  } else {
    return { graph_id: assistantId };
  }
}

export function ThreadProvider({ children }: { children: ReactNode }) {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] || "";
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const getThreads = useCallback(async (assistantId: string): Promise<Thread[]> => {
    if (!apiUrl || !assistantId) return [];
    const client = createClient(apiUrl, getApiKey() ?? undefined);

    const threads = await client.threads.search({
      metadata: {
        ...getThreadSearchMetadata(assistantId),
      },
      limit: 100,
    });

    return threads;
  }, [apiUrl]);

  const value = useMemo(() => ({
    getThreads,
    threads,
    setThreads,
    threadsLoading,
    setThreadsLoading,
  }), [getThreads, threads, threadsLoading]);

  return (
    <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>
  );
}

export function useThreads() {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error("useThreads must be used within a ThreadProvider");
  }
  return context;
}

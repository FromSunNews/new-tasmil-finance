"use client";

// 🔌 Pending message provider - persists message across CopilotKit remounts
// Uses sessionStorage to survive layout remounts during navigation

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'chat_pending_message';

interface PendingMessageContextValue {
  pendingMessage: string | null;
  setPendingMessage: (msg: string | null) => void;
}

const PendingMessageContext = createContext<PendingMessageContextValue | undefined>(undefined);

interface PendingMessageProviderProps {
  children: ReactNode;
}

export function PendingMessageProvider({ children }: PendingMessageProviderProps) {
  const [pendingMessage, setPendingMessageState] = useState<string | null>(() => {
    // Initialize from sessionStorage
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(STORAGE_KEY);
    }
    return null;
  });

  // Sync to sessionStorage when pendingMessage changes
  useEffect(() => {
    if (pendingMessage) {
      sessionStorage.setItem(STORAGE_KEY, pendingMessage);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [pendingMessage]);

  const setPendingMessage = useCallback((msg: string | null) => {
    console.log('[PendingMessageProvider] Setting pending message:', msg?.slice(0, 50));
    setPendingMessageState(msg);
  }, []);

  // Debug log
  console.log('[PendingMessageProvider] Current pending message:', pendingMessage);

  const value = useMemo<PendingMessageContextValue>(() => ({
    pendingMessage,
    setPendingMessage,
  }), [pendingMessage, setPendingMessage]);

  return (
    <PendingMessageContext.Provider value={value}>
      {children}
    </PendingMessageContext.Provider>
  );
}

export function usePendingMessage(): PendingMessageContextValue {
  const context = useContext(PendingMessageContext);
  if (!context) {
    throw new Error('usePendingMessage must be used within a PendingMessageProvider');
  }
  return context;
}

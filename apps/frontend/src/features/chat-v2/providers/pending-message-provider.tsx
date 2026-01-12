"use client";

/**
 * 🔌 Pending Message Provider
 * 
 * Persists the first message when creating a new thread.
 * Uses sessionStorage to survive navigation from /new to /{threadId}.
 * 
 * Flow:
 * 1. User sends message on /new
 * 2. Thread is created, message stored here
 * 3. Navigate to /{threadId}
 * 4. Message is retrieved and sent via CopilotKit
 * 5. Message is cleared
 */

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
  clearPendingMessage: () => void;
}

const PendingMessageContext = createContext<PendingMessageContextValue | undefined>(undefined);

export function PendingMessageProvider({ children }: { children: ReactNode }) {
  const [pendingMessage, setPendingMessageState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(STORAGE_KEY);
    }
    return null;
  });

  // Sync to sessionStorage
  useEffect(() => {
    if (pendingMessage) {
      sessionStorage.setItem(STORAGE_KEY, pendingMessage);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [pendingMessage]);

  const setPendingMessage = useCallback((msg: string | null) => {
    setPendingMessageState(msg);
  }, []);

  const clearPendingMessage = useCallback(() => {
    setPendingMessageState(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<PendingMessageContextValue>(() => ({
    pendingMessage,
    setPendingMessage,
    clearPendingMessage,
  }), [pendingMessage, setPendingMessage, clearPendingMessage]);

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

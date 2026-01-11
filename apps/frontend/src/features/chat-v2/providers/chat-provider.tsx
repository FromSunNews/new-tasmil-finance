"use client";

// 🔌 Main chat provider - combines all chat-related contexts

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { LangGraphProvider } from '@/features/chat-v2/providers/langgraph-provider';
import type { LangGraphAssistant } from '@/features/chat-v2/types';

// ============ Chat State Context ============

interface ChatStateContextValue {
  // Thread state
  threadId: string | null;
  setThreadId: (id: string | null) => void;
  
  // UI state
  hideToolCalls: boolean;
  setHideToolCalls: (hide: boolean) => void;
  chatHistoryOpen: boolean;
  setChatHistoryOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  
  // Assistant info
  assistantInfo: LangGraphAssistant | null;
  setAssistantInfo: (info: LangGraphAssistant | null) => void;
}

const ChatStateContext = createContext<ChatStateContextValue | undefined>(undefined);

interface ChatStateProviderProps {
  children: ReactNode;
  initialThreadId?: string | null;
}

function ChatStateProvider({ children, initialThreadId = null }: ChatStateProviderProps) {
  const [threadId, setThreadId] = useState<string | null>(initialThreadId);
  const [hideToolCalls, setHideToolCalls] = useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [assistantInfo, setAssistantInfo] = useState<LangGraphAssistant | null>(null);

  const handleSetChatHistoryOpen = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    if (typeof value === 'function') {
      setChatHistoryOpen(value);
    } else {
      setChatHistoryOpen(value);
    }
  }, []);

  const value = useMemo<ChatStateContextValue>(() => ({
    threadId,
    setThreadId,
    hideToolCalls,
    setHideToolCalls,
    chatHistoryOpen,
    setChatHistoryOpen: handleSetChatHistoryOpen,
    assistantInfo,
    setAssistantInfo,
  }), [
    threadId,
    hideToolCalls,
    chatHistoryOpen,
    handleSetChatHistoryOpen,
    assistantInfo,
  ]);

  return (
    <ChatStateContext.Provider value={value}>
      {children}
    </ChatStateContext.Provider>
  );
}

export function useChatState(): ChatStateContextValue {
  const context = useContext(ChatStateContext);
  if (!context) {
    throw new Error('useChatState must be used within a ChatProvider');
  }
  return context;
}

// ============ Combined Chat Provider ============

interface ChatProviderProps {
  children: ReactNode;
  initialThreadId?: string | null;
  apiKey?: string;
}

export function ChatProvider({ 
  children, 
  initialThreadId,
  apiKey,
}: ChatProviderProps) {
  return (
    <LangGraphProvider apiKey={apiKey}>
      <ChatStateProvider initialThreadId={initialThreadId}>
        {children}
      </ChatStateProvider>
    </LangGraphProvider>
  );
}

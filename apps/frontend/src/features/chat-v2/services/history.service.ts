// 🟢 Chat history service

import type { UniversalMessage } from '@/features/chat-v2/types';
import { getLangGraphClient } from '@/features/chat-v2/services/langgraph-client';
import { messageAdapter } from '@/features/chat-v2/lib/message-adapter';

export class HistoryService {
  /**
   * Check if client is available
   */
  private getClient() {
    try {
      return getLangGraphClient();
    } catch {
      return null;
    }
  }

  /**
   * Get chat history for a thread
   */
  async getHistory(threadId: string): Promise<UniversalMessage[]> {
    const client = this.getClient();
    if (!client) {
      console.warn('[HistoryService] Client not initialized');
      return [];
    }
    
    try {
      // getHistory returns an array of thread states
      const historyStates = await client.threads.getHistory(threadId);
      
      console.log('[HistoryService] Raw history states:', historyStates);
      
      // Get the latest state (first item)
      const latestState = historyStates[0];
      const values = latestState?.values as Record<string, unknown> | undefined;
      const rawMessages = values?.['messages'] as any[] | undefined;
      
      console.log('[HistoryService] Raw messages from state:', JSON.stringify(rawMessages, null, 2));
      
      if (!rawMessages) {
        return [];
      }

      const converted = rawMessages.map((msg: any) => {
        console.log('[HistoryService] Raw message before convert:', JSON.stringify(msg));
        const result = messageAdapter.fromLangGraph(msg);
        console.log('[HistoryService] Converted message:', JSON.stringify(result));
        return result;
      });
      
      // Filter out messages with empty content and no tool calls
      // But keep human messages (they should always have content)
      // Filter out tool response messages (role: 'ai' with JSON content starting with '{')
      const filtered = converted.filter(msg => {
        const hasContent = typeof msg.content === 'string' 
          ? msg.content.trim().length > 0 
          : false;
        const hasToolCalls = msg.toolCalls && msg.toolCalls.length > 0;
        
        // Filter out tool response messages (raw JSON responses from tools)
        const isToolResponse = msg.role === 'ai' && 
          typeof msg.content === 'string' && 
          msg.content.trim().startsWith('{');
        
        // Always keep human messages, filter out empty AI messages without tool calls
        const isHuman = msg.role === 'human';
        
        console.log('[HistoryService] Filter check:', msg.role, 'hasContent:', hasContent, 'hasToolCalls:', hasToolCalls, 'isToolResponse:', isToolResponse);
        
        if (isToolResponse) return false;
        if (isHuman) return hasContent; // Only keep human messages with content
        return hasContent || hasToolCalls;
      });
      
      console.log('[HistoryService] Filtered messages:', filtered);
      return filtered;
    } catch (error) {
      console.error('[HistoryService] Failed to get history:', error);
      return [];
    }
  }

  /**
   * Get thread state (includes messages and other state values)
   */
  async getThreadState(threadId: string): Promise<{
    messages: UniversalMessage[];
    values: Record<string, unknown>;
  } | null> {
    const client = this.getClient();
    if (!client) return null;
    
    try {
      const state = await client.threads.getState(threadId);
      
      const values = state?.values as Record<string, unknown> | undefined;
      const rawMessages = (values?.['messages'] ?? []) as any[];
      
      const messages = rawMessages.map((msg: any) =>
        messageAdapter.fromLangGraph(msg)
      );

      return {
        messages,
        values: values ?? {},
      };
    } catch (error) {
      console.error('[HistoryService] Failed to get thread state:', error);
      return null;
    }
  }

  /**
   * Add a message to thread history
   */
  async addMessage(threadId: string, message: UniversalMessage): Promise<void> {
    const client = this.getClient();
    if (!client) return;
    
    const langGraphMessage = messageAdapter.toLangGraph(message);
    
    await client.threads.updateState(threadId, {
      values: {
        messages: [langGraphMessage],
      } as any,
    });
  }

  /**
   * Clear thread history
   */
  async clearHistory(threadId: string): Promise<void> {
    const client = this.getClient();
    if (!client) return;
    
    await client.threads.updateState(threadId, {
      values: {
        messages: [],
      } as any,
    });
  }
}

// Singleton instance
export const historyService = new HistoryService();

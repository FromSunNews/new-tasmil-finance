// 🟢 Thread CRUD service

import { validate as isUUID } from 'uuid';
import type { Thread, ThreadCreateParams, ThreadListParams, ThreadMetadata } from '@/features/chat-v2/types';
import { getLangGraphClient } from '@/features/chat-v2/services/langgraph-client';

export class ThreadService {
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
   * Get threads for an assistant/graph
   */
  async getThreads(params: ThreadListParams): Promise<Thread[]> {
    const client = this.getClient();
    if (!client) return [];
    
    const { assistantId, graphId, limit = 100, offset = 0 } = params;

    const metadata = this.buildSearchMetadata(assistantId, graphId);
    
    const threads = await client.threads.search({
      metadata,
      limit,
      offset,
    });

    return threads.map(this.mapToThread);
  }

  /**
   * Get a single thread by ID
   */
  async getThread(threadId: string): Promise<Thread | null> {
    const client = this.getClient();
    if (!client) return null;
    
    try {
      const thread = await client.threads.get(threadId);
      return this.mapToThread(thread);
    } catch (error) {
      // Thread not found
      return null;
    }
  }

  /**
   * Create a new thread
   */
  async createThread(params: ThreadCreateParams = {}): Promise<Thread | null> {
    const client = this.getClient();
    if (!client) {
      console.warn('[ThreadService] Client not initialized, cannot create thread');
      return null;
    }
    
    const thread = await client.threads.create({
      metadata: params.metadata ?? {},
    });

    return this.mapToThread(thread);
  }

  /**
   * Update thread metadata
   */
  async updateThread(threadId: string, metadata: Partial<ThreadMetadata>): Promise<Thread | null> {
    const client = this.getClient();
    if (!client) return null;
    
    const thread = await client.threads.update(threadId, {
      metadata,
    });

    return this.mapToThread(thread);
  }

  /**
   * Delete a thread
   */
  async deleteThread(threadId: string): Promise<void> {
    const client = this.getClient();
    if (!client) return;
    
    await client.threads.delete(threadId);
  }

  /**
   * Build search metadata based on assistant/graph ID
   */
  private buildSearchMetadata(
    assistantId?: string,
    graphId?: string
  ): { assistant_id?: string; graph_id?: string } {
    if (assistantId && isUUID(assistantId)) {
      return { assistant_id: assistantId };
    }
    if (graphId) {
      return { graph_id: graphId };
    }
    if (assistantId) {
      return { graph_id: assistantId };
    }
    return {};
  }

  /**
   * Map LangGraph thread to our Thread type
   */
  private mapToThread(thread: any): Thread {
    return {
      id: thread.thread_id,
      metadata: thread.metadata ?? {},
      createdAt: new Date(thread.created_at),
      updatedAt: new Date(thread.updated_at),
      status: thread.status ?? 'active',
    };
  }
}

// Singleton instance
export const threadService = new ThreadService();

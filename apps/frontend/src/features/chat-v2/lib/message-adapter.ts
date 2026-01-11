// 🔧 Message adapter - Convert between different message formats

import type {
  UniversalMessage,
  ContentBlock,
  ToolCall,
  CopilotMessage,
  CopilotToolCall,
  LangGraphMessage,
  LangGraphToolCall,
} from '@/features/chat-v2/types';

/**
 * Adapter for converting messages between CopilotKit, LangGraph, and Universal formats
 */
class MessageAdapter {
  /**
   * Convert CopilotKit message to Universal format
   */
  fromCopilotKit(msg: CopilotMessage): UniversalMessage {
    return {
      id: msg.id,
      role: this.mapCopilotRole(msg.role),
      content: msg.content,
      toolCalls: msg.toolCalls?.map(tc => this.mapCopilotToolCall(tc)),
      metadata: {
        generativeUI: msg.generativeUI,
      },
    };
  }

  /**
   * Convert Universal message to CopilotKit format
   */
  toCopilotKit(msg: UniversalMessage): CopilotMessage {
    return {
      id: msg.id,
      role: this.mapToCopilotRole(msg.role),
      content: typeof msg.content === 'string' 
        ? msg.content 
        : this.contentBlocksToString(msg.content),
      toolCalls: msg.toolCalls?.map(tc => this.mapToCopilotToolCall(tc)),
    };
  }

  /**
   * Convert LangGraph message to Universal format
   */
  fromLangGraph(msg: LangGraphMessage): UniversalMessage {
    // LangGraph can use either 'type' or 'role' field
    // API responses often use 'role' (user/assistant) instead of 'type' (human/ai)
    const rawType = (msg.type || (msg as any).role) as string;
    
    // Map role values to our internal format
    let role: UniversalMessage['role'] = 'human';
    if (rawType === 'human' || rawType === 'user') {
      role = 'human';
    } else if (rawType === 'ai' || rawType === 'assistant') {
      role = 'ai';
    } else if (rawType === 'system') {
      role = 'system';
    } else if (rawType === 'tool') {
      role = 'ai'; // Tool messages are treated as AI responses
    }
    
    // Handle tool_calls from different formats
    const toolCalls = msg.tool_calls || (msg as any).toolCalls;
    
    return {
      id: msg.id,
      role,
      content: this.mapLangGraphContent(msg.content),
      toolCalls: toolCalls?.map((tc: any) => this.mapLangGraphToolCall(tc)),
      metadata: msg.additional_kwargs,
    };
  }

  /**
   * Convert Universal message to LangGraph format
   */
  toLangGraph(msg: UniversalMessage): LangGraphMessage {
    return {
      id: msg.id,
      type: this.mapToLangGraphRole(msg.role),
      content: typeof msg.content === 'string'
        ? msg.content
        : msg.content.map(block => this.mapToLangGraphContentBlock(block)),
      tool_calls: msg.toolCalls?.map(tc => this.mapToLangGraphToolCall(tc)),
      additional_kwargs: msg.metadata,
    };
  }

  // ============ Private helpers ============

  private mapCopilotRole(role: CopilotMessage['role']): UniversalMessage['role'] {
    const roleMap: Record<string, UniversalMessage['role']> = {
      user: 'human',
      assistant: 'ai',
      system: 'system',
    };
    return roleMap[role] ?? 'human';
  }

  private mapToCopilotRole(role: UniversalMessage['role']): CopilotMessage['role'] {
    const roleMap: Record<string, CopilotMessage['role']> = {
      human: 'user',
      ai: 'assistant',
      system: 'system',
    };
    return roleMap[role] ?? 'user';
  }

  private mapToLangGraphRole(role: UniversalMessage['role']): LangGraphMessage['type'] {
    const roleMap: Record<string, LangGraphMessage['type']> = {
      human: 'human',
      ai: 'ai',
      system: 'system',
    };
    return roleMap[role] ?? 'human';
  }

  private mapCopilotToolCall(tc: CopilotToolCall): ToolCall {
    let args: Record<string, unknown> = {};
    
    // Handle function-style tool calls
    if (tc.function?.arguments) {
      try {
        args = typeof tc.function.arguments === 'string'
          ? JSON.parse(tc.function.arguments)
          : tc.function.arguments;
      } catch {
        args = { _raw: tc.function.arguments };
      }
    } else if (tc.args) {
      args = tc.args;
    }

    return {
      id: tc.id,
      name: tc.function?.name ?? tc.name ?? 'unknown',
      args,
      result: tc.result,
      status: tc.status ?? 'pending',
    };
  }

  private mapToCopilotToolCall(tc: ToolCall): CopilotToolCall {
    return {
      id: tc.id,
      name: tc.name,
      args: tc.args,
      result: tc.result,
      status: tc.status,
    };
  }

  private mapLangGraphToolCall(tc: LangGraphToolCall | any): ToolCall {
    // Handle both formats: { name, args } and { function: { name, arguments } }
    let name = tc.name;
    let args = tc.args || {};
    
    if (tc.function) {
      name = tc.function.name || name;
      if (tc.function.arguments) {
        try {
          args = typeof tc.function.arguments === 'string' 
            ? JSON.parse(tc.function.arguments) 
            : tc.function.arguments;
        } catch {
          args = { _raw: tc.function.arguments };
        }
      }
    }
    
    return {
      id: tc.id,
      name: name || 'unknown',
      args,
      result: tc.result,
      status: tc.status || 'complete',
    };
  }

  private mapToLangGraphToolCall(tc: ToolCall): LangGraphToolCall {
    return {
      id: tc.id,
      name: tc.name,
      args: tc.args,
    };
  }

  private mapLangGraphContent(
    content: LangGraphMessage['content']
  ): UniversalMessage['content'] {
    console.log('[MessageAdapter] mapLangGraphContent input type:', typeof content, 'value:', JSON.stringify(content));
    
    // Handle null/undefined
    if (content === null || content === undefined) {
      console.log('[MessageAdapter] Content is null/undefined');
      return '';
    }
    
    // Handle string content
    if (typeof content === 'string') {
      console.log('[MessageAdapter] Content is string:', content.slice(0, 100));
      return content;
    }
    
    // Handle array content - LangGraph format: [{type: "text", text: "..."}]
    if (Array.isArray(content)) {
      console.log('[MessageAdapter] Content is array with', content.length, 'items');
      
      // Try to extract text from blocks
      const textParts: string[] = [];
      
      for (const block of content) {
        console.log('[MessageAdapter] Processing block:', JSON.stringify(block));
        
        if (typeof block === 'string') {
          textParts.push(block);
        } else if (block && typeof block === 'object') {
          // Handle {type: "text", text: "..."} format
          if (block.text) {
            textParts.push(block.text);
          }
          // Handle {type: "text", content: "..."} format (use bracket notation)
          else if (block['content'] && typeof block['content'] === 'string') {
            textParts.push(block['content']);
          }
        }
      }
      
      const result = textParts.join(' ');
      console.log('[MessageAdapter] Extracted text from array:', result.slice(0, 100));
      return result;
    }
    
    // Handle object content (might be a single block)
    if (typeof content === 'object') {
      console.log('[MessageAdapter] Content is object:', JSON.stringify(content));
      const obj = content as any;
      if (obj.text) return obj.text;
      if (obj['content'] && typeof obj['content'] === 'string') return obj['content'];
    }
    
    console.log('[MessageAdapter] Could not extract content, returning empty string');
    return '';
  }

  private mapToLangGraphContentBlock(block: ContentBlock): any {
    return {
      type: block.type,
      text: block.text,
      image_url: block.image_url,
    };
  }

  private contentBlocksToString(blocks: ContentBlock[]): string {
    return blocks
      .filter(b => b.type === 'text' && b.text)
      .map(b => b.text)
      .join(' ');
  }
}

export const messageAdapter = new MessageAdapter();

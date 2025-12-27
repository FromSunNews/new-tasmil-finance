import type { JwtPayload } from "../../auth/auth.service";
import type { UIMessageStreamWriter } from "ai";
import type { ChatMessage } from "../../common/types";

export interface IAgent {
  getId(): string;
  getName(): string;
  getDescription(): string[];
  getType(): 'Strategy' | 'Intelligence';
  getIcon(): string;
  getSupportedChains(): string[];
  getTools(
    user: JwtPayload,
    walletAddress?: string,
    dataStream?: UIMessageStreamWriter<ChatMessage>
  ): Record<string, any>;
  getSystemPrompt(): string;
}


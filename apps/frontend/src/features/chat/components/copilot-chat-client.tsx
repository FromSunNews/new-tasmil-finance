"use client";

import { useState, useRef, useEffect, FormEvent, useMemo, useCallback } from "react";
import { ArrowLeft, Send, Clock, ArrowDown, Paperclip, Square, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button-v2";
import { cn } from "@/lib/utils";
import { useMultiSidebar } from "@/shared/ui/multi-sidebar";
import { SuggestedActions } from "./suggested-actions";
import { Greeting } from "./greeting";
import { useFileUpload } from "@/shared/hooks/use-file-upload";
import { ContentBlocksPreview } from "@/features/chat/thread/components/content-blocks-preview";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useChatState } from "@/providers/chat-state-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { useCopilotChatHeadless_c } from "@copilotkit/react-core";
import { AssistantMessage, AssistantMessageLoading, HumanMessage } from "./copilot-messages";
import { useDefiActions } from "../hooks/use-defi-actions";
import { CopilotSuggestions } from "./copilot-suggestions";
import { toast } from "sonner";

// Agent configuration
const AGENT_CONFIG: Record<string, { name: string }> = {
  staking: { name: "Staking Agent" },
  research: { name: "Research Agent" },
  yield: { name: "Yield Agent" },
  bridge: { name: "Bridge Agent" },
} as const;

const DEFAULT_AGENT = { name: "DeFi Agent" };

interface CopilotChatClientProps {
  agentId: string;
  chatId: string;
}

export function CopilotChatClient({ agentId, chatId }: CopilotChatClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toggleRightSidebar } = useMultiSidebar();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const lastMessageCountRef = useRef(0);

  // File upload hook
  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    dragOver,
    handlePaste,
  } = useFileUpload();

  // CopilotKit chat hook (new headless API)
  const {
    messages: rawMessages,
    sendMessage,
    stopGeneration,
    isLoading,
    setMessages,
  } = useCopilotChatHeadless_c();

  // Convert CopilotKit messages to our format
  const messages = useMemo(() => {
    return rawMessages.map((msg: any) => {
      // Extract tool calls from assistant messages
      const toolCalls = msg.toolCalls?.map((tc: any) => {
        let args = {};
        try {
          args = typeof tc.function?.arguments === "string" 
            ? JSON.parse(tc.function.arguments || "{}") 
            : (tc.function?.arguments || tc.args || {});
        } catch {
          // Handle partial/streaming JSON - use empty object or raw string
          args = tc.function?.arguments ? { _raw: tc.function.arguments } : (tc.args || {});
        }
        
        return {
          id: tc.id,
          name: tc.function?.name || tc.name || "unknown",
          args,
          result: tc.result,
          status: tc.status,
        };
      }) || [];

      return {
        id: msg.id,
        type: msg.role === "user" ? "human" as const : "ai" as const,
        content: msg.content || "",
        toolCalls,
        generativeUI: msg.generativeUI,
        rawMessage: msg, // Keep reference to raw message for regeneration
      };
    });
  }, [rawMessages]);

  // Initialize DeFi actions
  useDefiActions();

  const { hideToolCalls, setHideToolCalls } = useChatState();

  const config = AGENT_CONFIG[agentId] || DEFAULT_AGENT;
  const chatTitle = chatId === "new" ? "New Chat" : `Chat with ${config.name}`;
  const isNewChat = messages.length === 0 && !isLoading;
  
  // Check if last AI message has content (streaming complete for that message)
  const lastAiMessage = messages.filter(m => m.type === "ai").pop();
  const isAiStreaming = isLoading && lastAiMessage && !lastAiMessage.content;
  
  // Show suggestions when: new chat OR agent finished responding
  const showSuggestions = isNewChat || (!isLoading && messages.length > 0);

  // Auto-scroll to bottom only when new messages arrive and user hasn't scrolled up
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current && !userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length, userScrolledUp]);

  // Track scroll position for scroll-to-bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
      
      // Track if user manually scrolled up
      if (!isNearBottom) {
        setUserScrolledUp(true);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    setUserScrolledUp(false);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim().length === 0 && contentBlocks.length === 0) || isLoading) return;

    // Create message content
    let messageContent = input.trim();
    
    // Add file content if any
    if (contentBlocks.length > 0) {
      const fileDescriptions = contentBlocks.map(block => {
        if (block.type === "image_url") {
          return `[Image: ${(block as any).image_url?.url || 'uploaded image'}]`;
        }
        return `[File: ${block.type}]`;
      }).join('\n');
      
      messageContent = messageContent ? `${messageContent}\n\n${fileDescriptions}` : fileDescriptions;
    }

    // Send message using CopilotKit
    sendMessage({
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
    });

    setInput("");
    setContentBlocks([]);
    setUserScrolledUp(false); // Reset scroll state when sending new message
  };

  // Regenerate AI response - remove last AI message and resend
  const handleRegenerate = useCallback((messageIndex: number) => {
    if (isLoading) return;
    
    // Find the message to regenerate
    const targetMessage = messages[messageIndex];
    if (!targetMessage || targetMessage.type !== "ai") {
      toast.error("Cannot regenerate this message");
      return;
    }

    // Get all messages before this AI message
    const messagesBeforeAI = rawMessages.slice(0, messageIndex);
    
    // Find the last user message before this AI message
    const lastUserMessage = [...messagesBeforeAI].reverse().find(m => m.role === "user");
    
    if (!lastUserMessage) {
      toast.error("No user message found to regenerate from");
      return;
    }

    // Remove messages from the AI message onwards
    setMessages(messagesBeforeAI);

    // Resend the last user message to trigger a new AI response
    setTimeout(() => {
      sendMessage({
        id: Date.now().toString(),
        role: "user",
        content: lastUserMessage.content,
      });
    }, 100);
  }, [isLoading, messages, rawMessages, setMessages, sendMessage]);

  // Edit human message - remove messages from this point and resend with new content
  const handleEditMessage = useCallback((messageIndex: number, newContent: string) => {
    if (isLoading || !newContent.trim()) return;

    // Get all messages before this message
    const messagesBefore = rawMessages.slice(0, messageIndex);
    
    // Update messages to remove from this point
    setMessages(messagesBefore);

    // Send the edited message
    setTimeout(() => {
      sendMessage({
        id: Date.now().toString(),
        role: "user",
        content: newContent,
      });
    }, 100);
  }, [isLoading, rawMessages, setMessages, sendMessage]);

  const handleSendSuggestion = (text: string) => {
    if (!text.trim() || isLoading) return;

    sendMessage({
      id: Date.now().toString(),
      role: "user",
      content: text,
    });
    setUserScrolledUp(false); // Reset scroll state
  };

  return (
    <>
      {/* Configure CopilotKit suggestions */}
      <CopilotSuggestions agentId={agentId} />
      
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header - no border */}
        <header className="flex shrink-0 items-center gap-3 bg-background px-4 py-3">
          <Button className="h-8 w-8 p-0" onClick={() => router.push("/agents")} variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-foreground text-lg">{chatTitle}</span>
          <div className="ml-auto">
            <Button className="h-9 w-9 p-0" onClick={toggleRightSidebar} variant="ghost">
              <Clock className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Messages Area - Scrollable, takes remaining space */}
        <div 
          ref={messagesContainerRef}
          className="relative flex-1 overflow-y-auto"
        >
          <div className="mx-auto max-w-3xl px-4 pt-6 pb-4">
            {isNewChat && <Greeting agentId={agentId} />}
            
            <div className="flex flex-col gap-4">
              {messages.map((message, index) => {
                return message.type === "human" ? (
                  <HumanMessage
                    key={message.id || `${message.type}-${index}`}
                    message={message}
                    isLoading={isLoading}
                    onEdit={(newContent) => handleEditMessage(index, newContent)}
                  />
                ) : (
                  <div key={message.id || `${message.type}-${index}`}>
                    <AssistantMessage
                      message={message}
                      isLoading={isLoading}
                      handleRegenerate={() => handleRegenerate(index)}
                    />
                    {/* Render generative UI if available */}
                    {message.generativeUI && (
                      <div className="mt-2 ml-11">
                        {typeof message.generativeUI === "function" 
                          ? message.generativeUI() 
                          : message.generativeUI}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Show loading only when waiting for first token */}
              {isLoading && (!lastAiMessage || isAiStreaming) && <AssistantMessageLoading />}
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className={cn(
                "fixed z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-lg hover:bg-accent transition-colors",
                isMobile ? "bottom-32 right-4" : "bottom-28 right-8"
              )}
            >
              <ArrowDown className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Fixed Input Area at Bottom - no border */}
        <div className={cn(
          "shrink-0 bg-background px-4 py-4",
          isMobile && "pb-6" // Extra padding on mobile for safe area
        )}>
          <div className="mx-auto max-w-3xl">
            {/* Suggestions - show when not loading */}
            {showSuggestions && (
              <div className="mb-4">
                <SuggestedActions agentId={agentId} onSendMessage={handleSendSuggestion} />
              </div>
            )}

            {/* Input Form */}
            <div
              ref={dropRef}
              className={cn(
                "rounded-xl border bg-muted/50 transition-all",
                dragOver ? "border-primary border-2 border-dotted" : "border-border"
              )}
            >
              <form onSubmit={handleSubmit}>
                {/* Content blocks preview */}
                <ContentBlocksPreview blocks={contentBlocks} onRemove={removeBlock} />
                
                {/* Text input */}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      const form = (e.target as HTMLElement)?.closest("form");
                      form?.requestSubmit();
                    }
                  }}
                  placeholder="Send a message..."
                  className="w-full resize-none border-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:outline-none min-h-[44px] max-h-[200px]"
                  rows={1}
                />

                {/* Bottom toolbar */}
                <div className="flex items-center justify-between px-3 pb-3">
                  <div className="flex items-center gap-1">
                    {/* Upload button with label */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label
                          htmlFor="file-input"
                          className="flex h-8 cursor-pointer items-center gap-1.5 px-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                          <Paperclip className="h-4 w-4" />
                          <span className="text-xs">Attach</span>
                        </label>
                      </TooltipTrigger>
                      <TooltipContent>Attach files (images, PDF)</TooltipContent>
                    </Tooltip>
                    <input
                      id="file-input"
                      type="file"
                      onChange={handleFileUpload}
                      multiple
                      accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                      className="hidden"
                    />
                    
                    {/* Toggle hide tools button with label */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setHideToolCalls(!hideToolCalls)}
                          className={cn(
                            "flex h-8 items-center gap-1.5 px-2 rounded-lg transition-colors",
                            hideToolCalls 
                              ? "bg-primary/10 text-primary" 
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <Wrench className="h-4 w-4" />
                          <span className="text-xs">Tools</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {hideToolCalls ? "Show tool calls" : "Hide tool calls"}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Send/Stop button */}
                  {isLoading ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          onClick={stopGeneration}
                          variant="destructive"
                          className="h-8 w-8 rounded-full p-0"
                        >
                          <Square className="h-3.5 w-3.5 fill-current" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Stop generating</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isLoading || (!input.trim() && contentBlocks.length === 0)}
                      className="h-8 w-8 rounded-full p-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

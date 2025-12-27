"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { memo, useState } from "react";
import type { Vote } from "@/lib/types";
import type { ChatMessage } from "@/lib/types";
import { cn, sanitizeText } from "@/lib/utils";
import { useDataStream } from "./data-stream-provider";
import { MessageContent } from "./elements/message";
import { Response } from "./elements/response";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "./elements/tool";
import { SparklesIcon } from "./icons";
import { MessageActions } from "./message-actions";
import { MessageEditor } from "./message-editor";
import { MessageReasoning } from "./message-reasoning";
import { PreviewAttachment } from "./preview-attachment";
import { ResearchResult } from "./research-result";
import { StakingOperationResult } from "./staking-operation-result";
import { StakingResult } from "./staking-result";
import { YieldResult } from "./yield-result";
import { BridgeResult } from "./bridge-result";

const PurePreviewMessage = ({
  addToolApprovalResponse,
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  requiresScrollPadding: requiresScrollPadding,
}: {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === "file"
  );

  useDataStream();

  return (
    <div
      className="group/message fade-in w-full animate-in duration-200"
      data-role={message.role}
      data-testid={`message-${message.role}`}
    >
      <div
        className={cn("flex w-full items-start gap-2 md:gap-3", {
          "justify-end": message.role === "user" && mode !== "edit",
          "justify-start": message.role === "assistant",
        })}
      >
        {message.role === "assistant" && (
          <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        <div
          className={cn("flex flex-col", {
            "gap-2 md:gap-4": message.parts?.some(
              (p) => p.type === "text" && p.text?.trim()
            ),
            "w-full":
              (message.role === "assistant" &&
                (message.parts?.some(
                  (p) => p.type === "text" && p.text?.trim()
                ) ||
                  message.parts?.some((p) => p.type.startsWith("tool-")))) ||
              mode === "edit",
            "max-w-[calc(100%-5.5rem)] sm:max-w-[min(fit-content,80%)]":
              message.role === "user" && mode !== "edit",
          })}
        >
          {attachmentsFromMessage.length > 0 && (
            <div
              className="flex flex-row justify-end gap-2"
              data-testid={"message-attachments"}
            >
              {attachmentsFromMessage.map((attachment) => (
                <PreviewAttachment
                  attachment={{
                    name: attachment.filename ?? "file",
                    contentType: attachment.mediaType,
                    url: attachment.url,
                  }}
                  key={attachment.url}
                />
              ))}
            </div>
          )}

          {message.parts?.map((part, index) => {
            const { type } = part;
            const key = `message-${message.id}-part-${index}`;

            if (type === "reasoning" && part.text?.trim().length > 0) {
              return (
                <MessageReasoning
                  isLoading={isLoading}
                  key={key}
                  reasoning={part.text}
                />
              );
            }

            if (type === "text") {
              if (mode === "view") {
                return (
                  <div key={key}>
                    <MessageContent
                      className={cn({
                        "w-fit break-words rounded-2xl border border-border bg-gradient-to-br from-blue-50 to-cyan-50 px-4 py-3 text-right shadow-sm dark:from-blue-950/50 dark:to-cyan-950/50":
                          message.role === "user",
                        "bg-transparent px-0 py-0 text-left text-base":
                          message.role === "assistant",
                      })}
                      data-testid="message-content"
                    >
                      <Response>{sanitizeText(part.text)}</Response>
                    </MessageContent>
                  </div>
                );
              }

              if (mode === "edit") {
                return (
                  <div
                    className="flex w-full flex-row items-start gap-3"
                    key={key}
                  >
                    <div className="size-8" />
                    <div className="min-w-0 flex-1">
                      <MessageEditor
                        key={message.id}
                        message={message}
                        regenerate={regenerate}
                        setMessages={setMessages}
                        setMode={setMode}
                      />
                    </div>
                  </div>
                );
              }
            }

            // Staking Query Tools - Special handling for staking query UI
            if (
              type === "tool-getAccountBalance" ||
              type === "tool-getCurrentEpoch" ||
              type === "tool-getTotalStake" ||
              type === "tool-getTotalActiveStake" ||
              type === "tool-getValidatorID" ||
              type === "tool-getValidatorInfo" ||
              type === "tool-getSelfStake" ||
              type === "tool-getStake" ||
              type === "tool-getUnlockedStake" ||
              type === "tool-getPendingRewards" ||
              type === "tool-getRewardsStash" ||
              type === "tool-getLockupInfo" ||
              type === "tool-getStakingAPR" ||
              type === "tool-getValidatorsInfo" ||
              type === "tool-getStakingStats"
            ) {
              const { toolCallId, state } = part;

              return (
                <Tool
                  className="w-full max-w-[calc(100%-1rem)] sm:max-w-[calc(100%-6rem)]"
                  defaultOpen={true}
                  key={toolCallId}
                >
                  <ToolHeader state={state} type={type} />
                  <ToolContent>
                    {state === "output-available" && (
                      <ToolOutput
                        errorText={
                          part.output && "error" in part.output
                            ? String(part.output.error)
                            : undefined
                        }
                        output={
                          part.output && !("error" in part.output) ? (
                            <StakingResult
                              result={part.output}
                              toolType={type}
                            />
                          ) : null
                        }
                      />
                    )}
                  </ToolContent>
                </Tool>
              );
            }

            // Staking Operations - Special handling for staking UI
            if (
              type === "tool-delegateStake" ||
              type === "tool-undelegateStake" ||
              type === "tool-claimRewards" ||
              type === "tool-restakeRewards" ||
              type === "tool-lockStake"
            ) {
              const { toolCallId, state } = part;

              return (
                <Tool
                  className="w-full max-w-[calc(100%-1rem)] sm:max-w-[500px]"
                  defaultOpen={true}
                  key={toolCallId}
                >
                  <ToolHeader state={state} type={type} />
                  <ToolContent>
                    {(state === "input-available" ||
                      state === "approval-requested") && (
                      <ToolInput input={part.input} />
                    )}
                    {state === "approval-requested" && (
                      (part as { approval?: { id: string } }).approval?.id && (
                        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                          <button
                            className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
                            onClick={() => {
                              addToolApprovalResponse({
                                id: (part as { approval?: { id: string } }).approval!.id,
                                approved: false,
                                reason: `User denied ${type}`,
                              });
                            }}
                            type="button"
                          >
                            Deny
                          </button>
                          <button
                            className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
                            onClick={() => {
                              addToolApprovalResponse({
                                id: (part as { approval?: { id: string } }).approval!.id,
                                approved: true,
                              });
                            }}
                            type="button"
                          >
                            Allow
                          </button>
                        </div>
                      )
                    )}
                    {state === "output-available" && (
                      <ToolOutput
                        errorText={
                          part.output && "error" in part.output
                            ? String(part.output.error)
                            : undefined
                        }
                        output={
                          part.output && !("error" in part.output) ? (
                            <StakingOperationResult
                              result={part.output}
                              toolCallId={
                                "toolCallId" in part
                                  ? part.toolCallId
                                  : undefined
                              }
                              toolType={type}
                            />
                          ) : null
                        }
                      />
                    )}
                  </ToolContent>
                </Tool>
              );
            }

            // Research Tools - Special handling for research UI
            if (
              type === "tool-getCryptoPrice" ||
              type === "tool-getMultiplePrices" ||
              type === "tool-getTrendingCoins" ||
              type === "tool-getTopCoins" ||
              type === "tool-searchCoins" ||
              type === "tool-getCryptoNews" ||
              type === "tool-getDefiTVL" ||
              type === "tool-getGlobalMarketData" ||
              type === "tool-analyzeCrypto" ||
              type === "tool-calculateInvestmentScore" ||
              type === "tool-compareCryptos" ||
              type === "tool-generateResearchSummary"
            ) {
              const { toolCallId, state } = part;

              return (
                <Tool
                  className="w-full max-w-[calc(100%-1rem)] sm:max-w-[500px]"
                  defaultOpen={false}
                  key={toolCallId}
                >
                  <ToolHeader state={state} type={type} />
                  <ToolContent>
                    {state === "output-available" && (
                      <ToolOutput
                        errorText={
                          part.output && "error" in part.output
                            ? String(part.output.error)
                            : undefined
                        }
                        output={
                          part.output && !("error" in part.output) ? (
                            <ResearchResult
                              result={part.output}
                              toolType={type}
                            />
                          ) : null
                        }
                      />
                    )}
                  </ToolContent>
                </Tool>
              );
            }

            // Yield Tools - Special handling for yield UI
            if (
              type === "tool-getYieldPools" ||
              type === "tool-getTopYieldsByChain" ||
              type === "tool-getYieldHistory" ||
              type === "tool-getYieldStats" ||
              type === "tool-searchPoolsByToken" ||
              type === "tool-getStablecoinYields"
            ) {
              const { toolCallId, state } = part;

              return (
                <Tool
                  className="w-full max-w-[calc(100%-1rem)] sm:max-w-[500px]"
                  defaultOpen={false}
                  key={toolCallId}
                >
                  <ToolHeader state={state} type={type} />
                  <ToolContent>
                    {state === "output-available" && (
                      <ToolOutput
                        errorText={
                          part.output && "error" in part.output
                            ? String(part.output.error)
                            : undefined
                        }
                        output={
                          part.output && !("error" in part.output) ? (
                            <YieldResult
                              result={part.output}
                              toolType={type}
                            />
                          ) : null
                        }
                      />
                    )}
                  </ToolContent>
                </Tool>
              );
            }

            // Bridge Tools - Special handling for bridge UI
            if (
              type === "tool-getBridgePairs" ||
              type === "tool-getBridgeQuote" ||
              type === "tool-bridgeTokens" ||
              type === "tool-getSupportedChains"
            ) {
              const { toolCallId, state } = part;

              return (
                <Tool
                  className="w-full max-w-[calc(100%-1rem)] sm:max-w-[500px]"
                  defaultOpen={false}
                  key={toolCallId}
                >
                  <ToolHeader state={state} type={type} />
                  <ToolContent>
                    {state === "output-available" && (
                      <ToolOutput
                        errorText={
                          part.output && "error" in part.output
                            ? String(part.output.error)
                            : undefined
                        }
                        output={
                          part.output && !("error" in part.output) ? (
                            <BridgeResult
                              result={part.output}
                              toolType={type}
                            />
                          ) : null
                        }
                      />
                    )}
                  </ToolContent>
                </Tool>
              );
            }

            // Generic tool rendering for all other tools
            if (type.startsWith("tool-")) {
              const toolPart = part as {
                toolCallId: string;
                state: string;
                input?: unknown;
                output?: unknown;
                errorText?: string;
                approval?: { id: string; approved?: boolean };
              };
              const { toolCallId, state } = toolPart;
              const approvalId = toolPart.approval?.id;
              const isDenied =
                state === "output-denied" ||
                (state === "approval-responded" &&
                  toolPart.approval?.approved === false);

              // Handle denied state
              if (isDenied) {
                return (
                  <Tool defaultOpen={true} key={toolCallId}>
                    <ToolHeader state="output-denied" type={type as `tool-${string}`} />
                    <ToolContent>
                      <div className="px-4 py-3 text-muted-foreground text-sm">
                        Tool execution was denied.
                      </div>
                    </ToolContent>
                  </Tool>
                );
              }

              // Handle approval-responded state
              if (state === "approval-responded") {
                return (
                  <Tool defaultOpen={true} key={toolCallId}>
                    <ToolHeader state={state} type={type as `tool-${string}`} />
                    <ToolContent>
                      <ToolInput input={toolPart.input} />
                    </ToolContent>
                  </Tool>
                );
              }

              // Handle other states (input-available, approval-requested, output-available, etc.)
              type ToolState = "input-streaming" | "input-available" | "approval-requested" | "approval-responded" | "output-available" | "output-error" | "output-denied";
              const toolState = state as ToolState;
              return (
                <Tool defaultOpen={true} key={toolCallId}>
                  <ToolHeader state={toolState} type={type as `tool-${string}`} />
                  <ToolContent>
                    {(toolState === "input-available" ||
                      toolState === "approval-requested") && (
                      <ToolInput input={toolPart.input} />
                    )}
                    {toolState === "approval-requested" && approvalId && (
                      <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                        <button
                          className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
                          onClick={() => {
                            addToolApprovalResponse({
                              id: approvalId,
                              approved: false,
                              reason: `User denied ${type}`,
                            });
                          }}
                          type="button"
                        >
                          Deny
                        </button>
                        <button
                          className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
                          onClick={() => {
                            addToolApprovalResponse({
                              id: approvalId,
                              approved: true,
                            });
                          }}
                          type="button"
                        >
                          Allow
                        </button>
                      </div>
                    )}
                    {toolState === "output-available" && (
                      <ToolOutput
                        errorText={toolPart.errorText}
                        output={
                          toolPart.output && typeof toolPart.output === 'object' && "error" in toolPart.output ? (
                            <div className="rounded border p-2 text-red-500">
                              Error: {String((toolPart.output as { error: unknown }).error)}
                            </div>
                          ) : (
                            toolPart.output
                          )
                        }
                      />
                    )}
                    {toolState === "output-error" && (
                      <ToolOutput
                        errorText={toolPart.errorText}
                        output={
                          <div className="rounded border p-2 text-red-500">
                            {toolPart.errorText || "An error occurred"}
                          </div>
                        }
                      />
                    )}
                  </ToolContent>
                </Tool>
              );
            }

            return null;
          })}

          <MessageActions
            chatId={chatId}
              isLoading={isLoading}
              key={`action-${message.id}`}
              message={message}
              setMode={setMode}
              vote={vote}
            />
          
        </div>
      </div>
    </div>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    // Always re-render when streaming to ensure text updates are visible
    if (nextProps.isLoading) {
      return false; // Force re-render during streaming
    }
    
    if (
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.message.id === nextProps.message.id &&
      prevProps.requiresScrollPadding === nextProps.requiresScrollPadding &&
      equal(prevProps.message.parts, nextProps.message.parts) &&
      equal(prevProps.vote, nextProps.vote)
    ) {
      return true;
    }
    return false;
  }
);

export const ThinkingMessage = () => {
  return (
    <div
      className="group/message fade-in w-full animate-in duration-300"
      data-role="assistant"
      data-testid="message-assistant-loading"
    >
      <div className="flex items-start justify-start gap-3">
        <div className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <div className="animate-pulse">
            <SparklesIcon size={14} />
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 md:gap-4">
          <div className="flex items-center gap-1 p-0 text-muted-foreground text-sm">
            <span className="animate-pulse">Thinking</span>
            <span className="inline-flex">
              <span className="animate-bounce [animation-delay:0ms]">.</span>
              <span className="animate-bounce [animation-delay:150ms]">.</span>
              <span className="animate-bounce [animation-delay:300ms]">.</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

"use client";

import { ToolCall as ToolCallUI, ToolState } from "@/features/chat/components/tool-call";

// CopilotKit tool call type
interface CopilotToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status?: "pending" | "running" | "complete" | "error";
}

export function ToolCalls({
  toolCalls,
  toolResults,
}: {
  toolCalls: CopilotToolCall[];
  toolResults?: Map<string, unknown>;
}) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {toolCalls.map((tc, idx) => {
        const args = tc.args as Record<string, unknown>;
        const hasArgs = Object.keys(args).length > 0;

        // Find corresponding tool result
        const toolResult = toolResults?.get(tc.id) ?? tc.result;

        // Determine state
        let state: ToolState;

        if (toolResult !== undefined) {
          // Check if error
          let hasError = false;
          try {
            const content =
              typeof toolResult === "string"
                ? JSON.parse(toolResult)
                : toolResult;
            hasError =
              typeof content === "object" && content !== null
                ? "error" in content || content.success === false
                : false;
          } catch {
            // ignore
          }
          state = hasError ? "output-error" : "output-available";
        } else if (tc.status === "running") {
          state = "input-available";
        } else if (tc.status === "error") {
          state = "output-error";
        } else {
          state = hasArgs ? "input-available" : "input-streaming";
        }

        const toolCallProps: any = {
          key: tc.id || idx,
          type: tc.name || "unknown",
          state: state,
          defaultOpen: false,
        };

        if (hasArgs) {
          toolCallProps.input = args;
        }

        if (toolResult !== undefined) {
          toolCallProps.output =
            typeof toolResult === "string"
              ? toolResult
              : (toolResult as Record<string, unknown>);
        }

        return <ToolCallUI {...toolCallProps} />;
      })}
    </div>
  );
}

export function ToolResult({
  result,
  name,
}: {
  result: unknown;
  name?: string;
}) {
  let parsedContent: Record<string, unknown> | string | unknown[];
  let hasError = false;

  try {
    if (typeof result === "string") {
      parsedContent = JSON.parse(result);
    } else if (Array.isArray(result)) {
      parsedContent = result;
    } else {
      parsedContent = String(result);
    }
  } catch {
    // Content is not JSON, use as string
    parsedContent = String(result);
  }

  // Check if content indicates an error
  if (
    typeof parsedContent === "object" &&
    parsedContent !== null &&
    !Array.isArray(parsedContent)
  ) {
    hasError = "error" in parsedContent || "Error" in parsedContent;
  } else if (typeof parsedContent === "string") {
    hasError = parsedContent.toLowerCase().includes("error");
  }

  const state: ToolState = hasError ? "output-error" : "output-available";

  // Convert to format expected by ToolCallUI
  const output =
    typeof parsedContent === "string"
      ? parsedContent
      : (parsedContent as Record<string, unknown>);

  const toolResultProps: any = {
    type: name || "tool-result",
    state: state,
    output: output,
    defaultOpen: false,
  };

  if (hasError && typeof parsedContent === "string") {
    toolResultProps.errorText = parsedContent;
  }

  return <ToolCallUI {...toolResultProps} />;
}

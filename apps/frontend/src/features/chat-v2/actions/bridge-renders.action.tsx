"use client";

// 🌉 Bridge tool renders - Custom UI for bridge agent backend tools

import { useRenderToolCall } from "@copilotkit/react-core";
import { BridgeResultCard } from "./components";

export function useBridgeRenders() {
  // Render for get_bridge_pairs
  useRenderToolCall({
    name: "get_bridge_pairs",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <BridgeResultCard
          toolName="get_bridge_pairs"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for get_bridge_quote
  useRenderToolCall({
    name: "get_bridge_quote",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <BridgeResultCard
          toolName="get_bridge_quote"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for get_supported_chains
  useRenderToolCall({
    name: "get_supported_chains",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <BridgeResultCard
          toolName="get_supported_chains"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });
}

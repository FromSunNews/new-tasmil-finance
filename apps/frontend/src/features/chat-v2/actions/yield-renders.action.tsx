"use client";

// 🌾 Yield tool renders - Custom UI for yield agent backend tools

import { useRenderToolCall } from "@copilotkit/react-core";
import { YieldResultCard } from "./components";

export function useYieldRenders() {
  // Render for get_yield_pools
  useRenderToolCall({
    name: "get_yield_pools",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <YieldResultCard
          toolName="get_yield_pools"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for get_top_yields_by_chain
  useRenderToolCall({
    name: "get_top_yields_by_chain",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <YieldResultCard
          toolName="get_top_yields_by_chain"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for get_yield_history
  useRenderToolCall({
    name: "get_yield_history",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <YieldResultCard
          toolName="get_yield_history"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for get_yield_stats
  useRenderToolCall({
    name: "get_yield_stats",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <YieldResultCard
          toolName="get_yield_stats"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for search_pools_by_token
  useRenderToolCall({
    name: "search_pools_by_token",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <YieldResultCard
          toolName="search_pools_by_token"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for get_stablecoin_yields
  useRenderToolCall({
    name: "get_stablecoin_yields",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <YieldResultCard
          toolName="get_stablecoin_yields"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });
}

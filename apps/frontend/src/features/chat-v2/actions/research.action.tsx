"use client";

// 🔬 Research CopilotKit action - Renders for research agent tools

import { useRenderToolCall } from "@copilotkit/react-core";
import { ResearchResultCard } from "./components";

export function useResearchRenders() {
  // Render for get_crypto_price
  useRenderToolCall({
    name: "get_crypto_price",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <ResearchResultCard
          toolName="get_crypto_price"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for get_top_coins
  useRenderToolCall({
    name: "get_top_coins",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <ResearchResultCard
          toolName="get_top_coins"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for get_trending_coins
  useRenderToolCall({
    name: "get_trending_coins",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <ResearchResultCard
          toolName="get_trending_coins"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for search_coins
  useRenderToolCall({
    name: "search_coins",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <ResearchResultCard
          toolName="search_coins"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for get_global_market_data
  useRenderToolCall({
    name: "get_global_market_data",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <ResearchResultCard
          toolName="get_global_market_data"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for get_defi_tvl
  useRenderToolCall({
    name: "get_defi_tvl",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <ResearchResultCard
          toolName="get_defi_tvl"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });

  // Render for get_crypto_news
  useRenderToolCall({
    name: "get_crypto_news",
    render: ({ args, result, status }) => {
      const normalizedStatus = status === "inProgress" ? "executing" : status;
      return (
        <ResearchResultCard
          toolName="get_crypto_news"
          args={args}
          result={result}
          status={normalizedStatus as any}
        />
      );
    },
  });
}

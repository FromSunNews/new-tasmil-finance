/**
 * Custom UI Components Registry
 * 
 * Register your custom UI components here.
 * These components will be rendered when the backend emits UI messages
 * with matching names.
 * 
 * Usage in backend:
 * ```typescript
 * ui.push({
 *   name: "bridge-result",  // Must match key in ComponentMap
 *   props: {
 *     result: {...},
 *     toolType: "tool-getBridgePairs"
 *   }
 * }, { message });
 * ```
 */

// DeFi components - now imported from feature directories
import { BridgeResult } from "@/features/bridge";
import { YieldResult } from "@/features/yield";
import { ResearchResult } from "@/features/research";

const ComponentMap = {
  // DeFi Agent UI Components
  "bridge-result": BridgeResult,
  "yield-result": YieldResult,
  "research-result": ResearchResult,
} as const;

export default ComponentMap;

// Export type for TypeScript support
export type ComponentMapType = typeof ComponentMap;

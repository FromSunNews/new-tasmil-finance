# CopilotKit Integration Guide

## Overview

This project has been successfully migrated to use CopilotKit 1.50.1 with custom UI instead of prebuilt UI components. The integration provides:

- **Custom Chat Interface**: Using `useCopilotChatHeadless_c` hook with our existing UI components
- **DeFi Actions**: Predefined actions for staking, bridging, yield farming, and portfolio analysis
- **Generative UI**: Custom components that render when actions are executed
- **Smart Suggestions**: Context-aware suggestions based on the selected agent

## Migration to CopilotKit 1.50.1

### Key Changes
- **Migrated from deprecated `useCopilotChat` to `useCopilotChatHeadless_c`**
- **Updated message format from classes to plain objects**
- **Changed API methods**: `visibleMessages` → `messages`, `appendMessage` → `sendMessage`
- **Removed `reloadMessages`** (not available in new API)

### API Comparison

| Old API (`useCopilotChat`) | New API (`useCopilotChatHeadless_c`) |
|---------------------------|-------------------------------------|
| `visibleMessages` | `messages` |
| `appendMessage` | `sendMessage` |
| `reloadMessages` | Not available |
| `stopGeneration` | `stopGeneration` |
| `isLoading` | `isLoading` |

## Key Components

### 1. CopilotChatClient
- Main chat component using `useCopilotChatHeadless_c` hook
- Renders custom UI with CopilotKit functionality
- Supports file uploads and tool interactions
- Uses new message format (plain objects instead of classes)

### 2. CopilotChatWrapper
- Wrapper component that provides necessary context providers
- Replaces the old LangGraph-based chat wrapper

### 3. DeFi Actions Hook (useDefiActions)
- Defines CopilotKit actions for DeFi operations:
  - `stake_tokens`: Stake tokens with custom UI
  - `bridge_tokens`: Bridge tokens between chains
  - `start_yield_farming`: Start yield farming
  - `analyze_portfolio`: Analyze user portfolio

### 4. CopilotSuggestions
- Configures context-aware suggestions based on agent type
- Uses `useCopilotChatSuggestions` hook

## Message Format Changes

CopilotKit 1.50.1 uses the new headless UI hook with a different API:

### Before (Deprecated `useCopilotChat`)
```tsx
import { useCopilotChat } from "@copilotkit/react-core";

const { visibleMessages, appendMessage, reloadMessages } = useCopilotChat();

// Send message
appendMessage({
  role: "user",
  content: messageContent,
});
```

### After (New `useCopilotChatHeadless_c`)
```tsx
import { useCopilotChatHeadless_c } from "@copilotkit/react-core";

const { messages, sendMessage } = useCopilotChatHeadless_c();

// Send message
sendMessage({
  id: Date.now().toString(),
  role: "user",
  content: messageContent,
});
```

## Usage

### Basic Chat Interface
```tsx
import { CopilotChatWrapper } from "@/features/chat";

export default function ChatPage() {
  return (
    <CopilotChatWrapper agentId="research" chatId="new" />
  );
}
```

### Using Actions
The actions are automatically available when using the chat interface. Users can:

1. **Stake Tokens**: "Stake 100 U2U for 90 days"
2. **Bridge Tokens**: "Bridge 50 ETH from Ethereum to U2U"
3. **Start Yield Farming**: "Start yield farming with U2U/USDT pair"
4. **Analyze Portfolio**: "Analyze my portfolio"

### Custom Actions
To add new actions, extend the `useDefiActions` hook:

```tsx
useCopilotAction({
  name: "your_action",
  description: "Description of your action",
  parameters: [
    {
      name: "param1",
      type: "string",
      description: "Parameter description",
      required: true,
    },
  ],
  handler: async ({ param1 }) => {
    // Your action logic
    return { success: true, data: "result" };
  },
  render: ({ result, args, status }) => {
    // Custom UI component - must return JSX element, not null
    if (status === "executing") {
      return <div>Loading...</div>;
    }
    if (status === "complete") {
      return <div>Completed: {result.data}</div>;
    }
    return <div></div>; // Always return JSX element
  },
});
```

## Migration from LangGraph

The old LangGraph-based chat components are still available:
- `ChatClient` - Original LangGraph implementation
- `ChatPageWrapper` - Original wrapper

New CopilotKit components:
- `CopilotChatClient` - CopilotKit implementation
- `CopilotChatWrapper` - CopilotKit wrapper

## Benefits of CopilotKit Integration

1. **Simplified State Management**: CopilotKit handles message state automatically
2. **Built-in Actions**: Easy to define and render custom actions
3. **Generative UI**: Rich UI components that render based on AI actions
4. **Smart Suggestions**: Context-aware suggestions improve UX
5. **Better Error Handling**: Built-in error handling and loading states
6. **Modern Message Format**: Plain objects instead of classes for better performance

## Testing

Visit `/copilot-test` to test the CopilotKit integration with sample DeFi actions.

## Configuration

The CopilotKit provider is configured in `layout.tsx`:

```tsx
<CopilotKit runtimeUrl="/api/copilotkit" agent="sample_agent">
  <AppProvider>
    {children}
  </AppProvider>
</CopilotKit>
```

The runtime endpoint at `/api/copilotkit` connects to your LangGraph agent backend.

## Important Notes

1. **No `@copilotkit/runtime-client-gql`**: This package doesn't exist. Use plain objects for messages.
2. **Render Functions**: Always return JSX elements from render functions, never `null`.
3. **Message Roles**: Use string literals like `"user"` and `"assistant"` instead of enum values.
4. **Generative UI**: Access via `message.generativeUI()` property on messages.
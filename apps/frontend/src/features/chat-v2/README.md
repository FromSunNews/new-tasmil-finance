# Chat V2 Feature

Clean architecture cho CopilotKit + LangGraph chat integration.

## Cấu trúc thư mục

```
src/features/chat-v2/
├── index.ts                        # Public exports
│
├── types/                          # 📘 All types
│   ├── index.ts
│   ├── message.types.ts            # UniversalMessage, ToolCall, ContentBlock
│   ├── thread.types.ts             # Thread, ThreadMetadata
│   ├── copilot.types.ts            # CopilotKit-specific types
│   └── langgraph.types.ts          # LangGraph-specific types
│
├── config/                         # ⚙️ Configurations
│   ├── index.ts
│   └── agents.config.ts            # Agent definitions & suggestions
│
├── services/                       # 🟢 LangGraph services
│   ├── index.ts
│   ├── langgraph-client.ts         # SDK client factory
│   ├── thread.service.ts           # Thread CRUD
│   └── history.service.ts          # Chat history
│
├── providers/                      # 🔌 React contexts
│   ├── index.ts
│   ├── chat-provider.tsx           # Main provider (combines all)
│   └── langgraph-provider.tsx      # LangGraph context
│
├── hooks/                          # 🪝 React hooks
│   ├── index.ts
│   ├── use-chat-session.ts         # Main orchestration
│   ├── use-copilot-chat.ts         # CopilotKit wrapper
│   └── use-chat-scroll.ts          # Scroll behavior
│
├── actions/                        # ⚡ CopilotKit actions
│   ├── index.ts
│   ├── staking.action.tsx
│   ├── bridge.action.tsx
│   ├── yield.action.tsx
│   └── portfolio.action.tsx
│
├── components/                     # 🎨 UI components
│   ├── index.ts
│   ├── chat-page.tsx               # Top-level page
│   ├── chat-container.tsx          # Main layout
│   ├── chat-header.tsx
│   ├── chat-input.tsx
│   ├── chat-messages.tsx
│   ├── greeting.tsx
│   ├── suggestions.tsx
│   └── messages/
│       ├── index.ts
│       ├── human-message.tsx
│       ├── assistant-message.tsx
│       ├── assistant-loading.tsx
│       └── tool-calls-display.tsx
│
└── lib/                            # 🔧 Utilities
    ├── index.ts
    └── message-adapter.ts          # Convert between formats
```

## Phân chia trách nhiệm

### CopilotKit handles:
- ✅ Real-time chat UI
- ✅ Message streaming
- ✅ Tool calls execution
- ✅ Suggestions generation
- ✅ File uploads
- ✅ Regenerate/Edit functionality

### LangGraph handles:
- ✅ Thread persistence
- ✅ Chat history storage
- ✅ Agent execution (Python backend)
- ✅ Thread metadata management

## Sử dụng

### Basic usage trong page:

```tsx
import { ChatPage } from '@/features/chat-v2';

export default function ChatPageRoute({ params }) {
  return <ChatPage agentId={params.agentId} chatId={params.chatId} />;
}
```

### Custom usage với hooks:

```tsx
import { 
  ChatProvider, 
  useChatSession, 
  ChatMessages, 
  ChatInput 
} from '@/features/chat-v2';

function CustomChat({ agentId, chatId }) {
  return (
    <ChatProvider initialThreadId={chatId}>
      <ChatContent agentId={agentId} chatId={chatId} />
    </ChatProvider>
  );
}

function ChatContent({ agentId, chatId }) {
  const { messages, isLoading, sendMessage } = useChatSession({ 
    agentId, 
    chatId 
  });

  return (
    <div>
      <ChatMessages messages={messages} isLoading={isLoading} />
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
}
```

### Thêm action mới:

```tsx
// actions/my-action.tsx
import { useCopilotAction } from '@copilotkit/react-core';

export function useMyAction() {
  useCopilotAction({
    name: 'my_action',
    description: 'Description',
    parameters: [...],
    handler: async (args) => { ... },
    render: ({ status, args, result }) => { ... },
  });
}

// actions/index.ts
export { useMyAction } from './my-action';

export function useDefiActions() {
  useStakingAction();
  useBridgeAction();
  useYieldAction();
  usePortfolioAction();
  useMyAction(); // Add here
}
```

### Thêm agent mới:

```ts
// config/agents.config.ts
export const AGENTS: Record<string, AgentConfig> = {
  // ... existing agents
  
  myAgent: {
    id: 'myAgent',
    name: 'My Agent',
    description: 'Description',
    suggestions: ['Suggestion 1', 'Suggestion 2'],
    capabilities: ['capability_1', 'capability_2'],
  },
};
```

## Key patterns

### Message Adapter
Chuyển đổi giữa các format message:
- `CopilotMessage` ↔ `UniversalMessage` ↔ `LangGraphMessage`

### Service Layer
- `ThreadService`: CRUD operations cho threads
- `HistoryService`: Load/save chat history
- `LangGraphClient`: SDK client singleton

### Provider Composition
```
ChatProvider
├── LangGraphProvider (thread management)
└── ChatStateProvider (UI state)
```

### Hook Composition
```
useChatSession (orchestration)
├── useCopilotChat (CopilotKit wrapper)
├── useLangGraph (thread operations)
└── useChatState (UI state)
```

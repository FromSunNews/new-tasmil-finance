// Chat feature barrel export
export * from './types';
export * from './constants';

// Components - CopilotKit implementation
export { CopilotChatClient } from './components/copilot-chat-client';
export { CopilotChatWrapper } from './components/copilot-chat-wrapper';
export { CopilotSuggestions } from './components/copilot-suggestions';
export { Greeting } from './components/greeting';
export { SuggestedActions } from './components/suggested-actions';
export { Suggestion } from './components/suggestion';
export { ToolCall } from './components/tool-call';

// Thread components (part of chat)
export { ArtifactProvider, ArtifactContent, ArtifactTitle, useArtifact, useArtifactOpen, useArtifactContext } from './thread/components/artifact';
export { ContentBlocksPreview } from './thread/components/content-blocks-preview';
export { MarkdownText } from './thread/components/markdown-text';
export { MultimodalPreview } from './thread/components/multimodal-preview';
export { SyntaxHighlighter } from './thread/components/syntax-highlighter';
export { TooltipIconButton } from './thread/components/tooltip-icon-button';

// Hooks
export { useDefiActions } from './hooks/use-defi-actions';

// API functions will be exported here once they are created
// export * from './api';

// Providers will be exported here once they are moved
// export * from './providers';

// Utils will be exported here once they are created
// export * from './utils';
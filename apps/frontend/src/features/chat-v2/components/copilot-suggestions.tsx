"use client";

// 🎨 CopilotKit suggestions configuration
// This component configures CopilotKit's built-in suggestion system
// Currently disabled because useCopilotChatSuggestions requires 'default' agent

interface CopilotSuggestionsProps {
  agentId: string;
}

export function CopilotSuggestions(_props: CopilotSuggestionsProps) {
  // Temporarily disabled - useCopilotChatSuggestions requires 'default' agent
  // which doesn't exist in our backend
  return null;
}

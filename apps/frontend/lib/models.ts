// Chat model configuration
// These are the models available for chat

export const DEFAULT_CHAT_MODEL = "gpt-4o-mini";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description?: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Fast and efficient for most tasks",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Most capable model for complex tasks",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    description: "High performance with vision capabilities",
  },
  {
    id: "claude-3-5-sonnet-latest",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Balanced performance and speed",
  },
  {
    id: "claude-3-5-haiku-latest",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    description: "Fast and cost-effective",
  },
];

// Group models by provider
export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider]!.push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);

// Title generation prompt
export const titlePrompt = `You are a title generator. Generate a short, concise title (max 50 characters) for the conversation based on the user's first message. The title should capture the main topic or intent. Return only the title, nothing else.`;

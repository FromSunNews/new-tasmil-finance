import { Injectable } from "@nestjs/common";
import { openai } from "@ai-sdk/openai";
import { customProvider } from "ai";
const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

// Map gateway model IDs to OpenAI model names
function mapModelIdToOpenAI(modelId: string): string {
  // Remove provider prefix (e.g., "openai/")
  const modelName = modelId.replace(/^[^/]+\//, "");

  // Map gateway model IDs to actual OpenAI model names
  const modelMap: Record<string, string> = {
    "gpt-4.1-mini": "gpt-4o-mini",
    "gpt-5.2": "gpt-4o",
    "gpt-4-turbo": "gpt-4-turbo",
    "gpt-4": "gpt-4",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
  };

  // If exact match found, return it
  if (modelMap[modelName]) {
    return modelMap[modelName];
  }

  // If it's already a valid OpenAI model name, return as is
  if (modelName.startsWith("gpt-")) {
    return modelName;
  }

  // Default fallback
  return "gpt-4o-mini";
}

@Injectable()
export class AiService {
  private myProvider: ReturnType<typeof customProvider> | null = null;

  constructor() {
    if (isTestEnvironment) {
      // Mock provider for tests - would need to be implemented
      // this.myProvider = customProvider({ ... });
    }
  }

  getLanguageModel(modelId: string) {
    if (isTestEnvironment && this.myProvider) {
      return this.myProvider.languageModel(modelId);
    }

    // Only handle OpenAI models for now
    // If modelId starts with "openai/", use OpenAI provider
    if (modelId.startsWith("openai/")) {
      const openaiModelId = mapModelIdToOpenAI(modelId);
      return openai(openaiModelId) as any;
    }

    // For other providers, you can add them here later
    // For now, default to OpenAI gpt-4o-mini
    console.warn(`Unknown provider for model ${modelId}, defaulting to gpt-4o-mini`);
    return openai("gpt-4o-mini") as any;
  }

  getTitleModel() {
    if (isTestEnvironment && this.myProvider) {
      return this.myProvider.languageModel("title-model");
    }
    // Use OpenAI for title generation
    return openai("gpt-4o-mini") as any;
  }

  getArtifactModel() {
    if (isTestEnvironment && this.myProvider) {
      return this.myProvider.languageModel("artifact-model");
    }
    // Use OpenAI for artifact generation
    return openai("gpt-4o-mini") as any;
  }
}


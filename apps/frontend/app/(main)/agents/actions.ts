"use server";

import { generateText, type UIMessage, type LanguageModel } from "ai";
import { cookies } from "next/headers";
import { titlePrompt } from "@/lib/models";
import { createOpenAI } from "@ai-sdk/openai";

// Get title model for generating chat titles
function getTitleModel(): LanguageModel {
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return openai("gpt-4o-mini") as unknown as LanguageModel;
}

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  // Convert UIMessage to string for title generation
  let messageText = "";
  if (typeof message === "string") {
    messageText = message;
  } else if (message && typeof message === "object" && "parts" in message) {
    messageText = (message.parts as Array<{ type: string; text?: string }>)
      .filter((part) => part.type === "text")
      .map((part) => part.text || "")
      .join("");
  }
  
  const { text: title } = await generateText({
    model: getTitleModel(),
    system: titlePrompt,
    prompt: messageText,
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  try {
    const { chatControllerDeleteTrailingMessages } = await import('@/gen/client');
    const { getServerWithAuth } = await import('@/lib/server-api-client');
    const withAuth = await getServerWithAuth();
    await chatControllerDeleteTrailingMessages({ id } as any, withAuth);
  } catch (error) {
    console.error("Failed to delete trailing messages:", error);
    throw error;
  }
}
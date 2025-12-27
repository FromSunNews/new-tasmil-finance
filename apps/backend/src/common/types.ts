import type { UIMessage } from "ai";
import { z } from "zod";
import type { Suggestion } from "../database/schema";

// Re-export ArtifactKind from db package for convenience
export type ArtifactKind = "text" | "code" | "image" | "sheet";
export type VisibilityType = "private" | "public";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// Tool types - these will be defined in backend
export type ChatTools = {
  getWeather: any;
  createDocument: any;
  updateDocument: any;
  requestSuggestions: any;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  "chat-title": string;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};

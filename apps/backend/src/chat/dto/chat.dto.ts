import { PostChatRequestBody } from "@repo/api";

export class CreateChatDto implements PostChatRequestBody {
  id!: string;
  message?: {
    id: string;
    role: "user";
    parts: Array<{
      type: "text" | "file";
      text?: string;
      mediaType?: "image/jpeg" | "image/png";
      name?: string;
      url?: string;
    }>;
  };
  messages?: Array<{
    id: string;
    role: string;
    parts: any[];
  }>;
  selectedChatModel!: string;
  selectedVisibilityType!: "public" | "private";
}


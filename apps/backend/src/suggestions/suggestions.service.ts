import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { getSuggestionsByDocumentId } from "@repo/db";
import { ChatSDKError } from "@repo/api";

@Injectable()
export class SuggestionsService {
  async getSuggestions(documentId: string, userId: string) {
    const suggestions = await getSuggestionsByDocumentId({ documentId });

    if (suggestions.length === 0) {
      return [];
    }

    const [suggestion] = suggestions;

    if (suggestion.userId !== userId) {
      throw new HttpException(
        new ChatSDKError("forbidden:api"),
        HttpStatus.FORBIDDEN
      );
    }

    return suggestions;
  }
}


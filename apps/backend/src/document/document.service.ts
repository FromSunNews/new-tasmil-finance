import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveDocument,
  type ArtifactKind,
} from "../database";
import { ChatSDKError } from "../common/errors";

@Injectable()
export class DocumentService {
  async getDocument(id: string, userId: string) {
    const documents = await getDocumentsById({ id });
    const [document] = documents;

    if (!document) {
      throw new HttpException(
        new ChatSDKError("not_found:document"),
        HttpStatus.NOT_FOUND
      );
    }

    if (document.userId !== userId) {
      throw new HttpException(
        new ChatSDKError("forbidden:document"),
        HttpStatus.FORBIDDEN
      );
    }

    return documents;
  }

  async createDocument(
    id: string,
    title: string,
    kind: ArtifactKind,
    content: string,
    userId: string
  ) {
    return saveDocument({
      id,
      title,
      kind,
      content,
      userId,
    });
  }

  async deleteDocument(id: string, timestamp: Date, userId: string) {
    const documents = await getDocumentsById({ id });
    const [document] = documents;

    if (!document) {
      throw new HttpException(
        new ChatSDKError("not_found:document"),
        HttpStatus.NOT_FOUND
      );
    }

    if (document.userId !== userId) {
      throw new HttpException(
        new ChatSDKError("forbidden:document"),
        HttpStatus.FORBIDDEN
      );
    }

    return deleteDocumentsByIdAfterTimestamp({ id, timestamp });
  }
}


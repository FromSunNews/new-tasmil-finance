import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request } from "express";
import { DocumentService } from "./document.service";
import { JwtAuthGuard } from "../auth/guards/auth.guard";
import { ChatSDKError } from "@repo/api";
import type { JwtPayload } from "../auth/auth.service";
import type { ArtifactKind } from "@repo/api";

@Controller("api/document")
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  @Get()
  async getDocument(@Query("id") id: string, @Req() req: Request) {
    const user = req.user as JwtPayload;

    if (!id) {
      throw new HttpException(
        new ChatSDKError("bad_request:api", "Parameter id is missing"),
        HttpStatus.BAD_REQUEST
      );
    }

    if (!user) {
      throw new HttpException(
        new ChatSDKError("unauthorized:document"),
        HttpStatus.UNAUTHORIZED
      );
    }

    return this.documentService.getDocument(id, user.id);
  }

  @Post()
  async createDocument(
    @Query("id") id: string,
    @Body() body: { title: string; kind: ArtifactKind; content: string },
    @Req() req: Request
  ) {
    const user = req.user as JwtPayload;

    if (!id) {
      throw new HttpException(
        new ChatSDKError("bad_request:api", "Parameter id is missing"),
        HttpStatus.BAD_REQUEST
      );
    }

    if (!user) {
      throw new HttpException(
        new ChatSDKError("unauthorized:document"),
        HttpStatus.UNAUTHORIZED
      );
    }

    return this.documentService.createDocument(
      id,
      body.title,
      body.kind,
      body.content,
      user.id
    );
  }

  @Delete()
  async deleteDocument(
    @Query("id") id: string,
    @Query("timestamp") timestamp: string,
    @Req() req: Request
  ) {
    const user = req.user as JwtPayload;

    if (!id) {
      throw new HttpException(
        new ChatSDKError("bad_request:api", "Parameter id is required."),
        HttpStatus.BAD_REQUEST
      );
    }

    if (!timestamp) {
      throw new HttpException(
        new ChatSDKError("bad_request:api", "Parameter timestamp is required."),
        HttpStatus.BAD_REQUEST
      );
    }

    if (!user) {
      throw new HttpException(
        new ChatSDKError("unauthorized:document"),
        HttpStatus.UNAUTHORIZED
      );
    }

    return this.documentService.deleteDocument(id, new Date(timestamp), user.id);
  }
}


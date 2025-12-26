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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from "@nestjs/swagger";
import { Request } from "express";
import { DocumentService } from "./document.service";
import { JwtAuthGuard } from "../auth/guards/auth.guard";
import { ChatSDKError } from "@repo/api";
import type { JwtPayload } from "../auth/auth.service";
import type { ArtifactKind } from "@repo/api";

@ApiTags("document")
@ApiBearerAuth("JWT-auth")
@Controller("document")
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  @Get()
  @ApiOperation({ summary: "Get document by ID" })
  @ApiQuery({ name: "id", required: true, type: String })
  @ApiResponse({ status: 200, description: "Document retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
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
  @ApiOperation({ summary: "Create a new document" })
  @ApiQuery({ name: "id", required: true, type: String })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        kind: { type: "string", enum: ["text", "code", "sheet"] },
        content: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 201, description: "Document created" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
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
  @ApiOperation({ summary: "Delete a document" })
  @ApiQuery({ name: "id", required: true, type: String })
  @ApiQuery({ name: "timestamp", required: true, type: String })
  @ApiResponse({ status: 200, description: "Document deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
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


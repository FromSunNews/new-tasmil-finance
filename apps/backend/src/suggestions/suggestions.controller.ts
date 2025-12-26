import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { Request } from "express";
import { SuggestionsService } from "./suggestions.service";
import { JwtAuthGuard } from "../auth/guards/auth.guard";
import { ChatSDKError } from "@repo/api";
import type { JwtPayload } from "../auth/auth.service";

@ApiTags("suggestions")
@ApiBearerAuth("JWT-auth")
@Controller("suggestions")
@UseGuards(JwtAuthGuard)
export class SuggestionsController {
  constructor(private suggestionsService: SuggestionsService) {}

  @Get()
  @ApiOperation({ summary: "Get suggestions for a document" })
  @ApiQuery({ name: "documentId", required: true, type: String })
  @ApiResponse({ status: 200, description: "Suggestions retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async getSuggestions(@Query("documentId") documentId: string, @Req() req: Request) {
    const user = req.user as JwtPayload;

    if (!documentId) {
      throw new HttpException(
        new ChatSDKError("bad_request:api", "Parameter documentId is required."),
        HttpStatus.BAD_REQUEST
      );
    }

    if (!user) {
      throw new HttpException(
        new ChatSDKError("unauthorized:suggestions"),
        HttpStatus.UNAUTHORIZED
      );
    }

    return this.suggestionsService.getSuggestions(documentId, user.id);
  }
}


import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from "@nestjs/swagger";
import { Request } from "express";
import { VoteService } from "./vote.service";
import { JwtAuthGuard } from "../auth/guards/auth.guard";
import { ChatSDKError } from "../common/errors";
import type { JwtPayload } from "../auth/auth.service";

@ApiTags("vote")
@ApiBearerAuth("JWT-auth")
@Controller("vote")
@UseGuards(JwtAuthGuard)
export class VoteController {
  constructor(private voteService: VoteService) {}

  @Get()
  @ApiOperation({ summary: "Get votes for a chat" })
  @ApiQuery({ name: "chatId", required: true, type: String })
  @ApiResponse({ status: 200, description: "Votes retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async getVotes(@Query("chatId") chatId: string, @Req() req: Request) {
    const user = req.user as JwtPayload;

    if (!chatId) {
      throw new HttpException(
        new ChatSDKError("bad_request:api", "Parameter chatId is required."),
        HttpStatus.BAD_REQUEST
      );
    }

    if (!user) {
      throw new HttpException(
        new ChatSDKError("unauthorized:vote"),
        HttpStatus.UNAUTHORIZED
      );
    }

    return this.voteService.getVotes(chatId, user.id);
  }

  @Patch()
  @ApiOperation({ summary: "Vote on a message" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        chatId: { type: "string" },
        messageId: { type: "string" },
        type: { type: "string", enum: ["up", "down"] },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Vote recorded" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async vote(
    @Body() body: { chatId: string; messageId: string; type: "up" | "down" },
    @Req() req: Request
  ) {
    const user = req.user as JwtPayload;

    if (!body.chatId || !body.messageId || !body.type) {
      throw new HttpException(
        new ChatSDKError("bad_request:api", "Parameters chatId, messageId, and type are required."),
        HttpStatus.BAD_REQUEST
      );
    }

    if (!user) {
      throw new HttpException(
        new ChatSDKError("unauthorized:vote"),
        HttpStatus.UNAUTHORIZED
      );
    }

    return this.voteService.vote(body.chatId, body.messageId, body.type, user.id);
  }
}


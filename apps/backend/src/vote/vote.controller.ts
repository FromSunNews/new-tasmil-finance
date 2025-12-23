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
import { Request } from "express";
import { VoteService } from "./vote.service";
import { JwtAuthGuard } from "../auth/guards/auth.guard";
import { ChatSDKError } from "@repo/api";
import type { JwtPayload } from "../auth/auth.service";

@Controller("api/vote")
@UseGuards(JwtAuthGuard)
export class VoteController {
  constructor(private voteService: VoteService) {}

  @Get()
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


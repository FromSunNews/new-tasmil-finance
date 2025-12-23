import {
  Controller,
  Get,
  Delete,
  Query,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request } from "express";
import { HistoryService } from "./history.service";
import { JwtAuthGuard } from "../auth/guards/auth.guard";
import { ChatSDKError } from "@repo/api";
import type { JwtPayload } from "../auth/auth.service";

@Controller("api/history")
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  @Get()
  async getHistory(
    @Query("limit") limit: string,
    @Query("starting_after") startingAfter: string | null,
    @Query("ending_before") endingBefore: string | null,
    @Req() req: Request
  ) {
    const user = req.user as JwtPayload;

    if (!user) {
      throw new HttpException(
        new ChatSDKError("unauthorized:chat"),
        HttpStatus.UNAUTHORIZED
      );
    }

    if (startingAfter && endingBefore) {
      throw new HttpException(
        new ChatSDKError("bad_request:api", "Only one of starting_after or ending_before can be provided."),
        HttpStatus.BAD_REQUEST
      );
    }

    const limitNum = Number.parseInt(limit || "10", 10);
    return this.historyService.getChats(user.id, limitNum, startingAfter, endingBefore);
  }

  @Delete()
  async deleteAllHistory(@Req() req: Request) {
    const user = req.user as JwtPayload;

    if (!user) {
      throw new HttpException(
        new ChatSDKError("unauthorized:chat"),
        HttpStatus.UNAUTHORIZED
      );
    }

    return this.historyService.deleteAllChats(user.id);
  }
}


import { Controller, Get, Delete, Query, Req, UseGuards, HttpException, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { HistoryService } from "./history.service";
import { JwtAuthGuard } from "../auth/guards/auth.guard";
import { ChatSDKError } from "../common/errors";
import type { JwtPayload } from "../auth/auth.service";

const isProd = process.env.NODE_ENV === 'production';

@ApiTags("history")
@ApiBearerAuth("JWT-auth")
@Controller("history")
@UseGuards(JwtAuthGuard)
@Throttle({ history: { limit: isProd ? 100 : 1000, ttl: 60000 } })
export class HistoryController {
  constructor(private historyService: HistoryService) {}

  private getUser(req: Request): JwtPayload {
    const user = req.user as JwtPayload;
    if (!user) {
      throw new HttpException(new ChatSDKError("unauthorized:chat"), HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  @Get()
  @ApiOperation({ summary: "Get chat history" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "starting_after", required: false, type: String })
  @ApiQuery({ name: "ending_before", required: false, type: String })
  @ApiQuery({ name: "agentId", required: false, type: String })
  @ApiResponse({ status: 200, description: "History retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async getHistory(
    @Query("limit") limit: string,
    @Query("starting_after") startingAfter: string | null,
    @Query("ending_before") endingBefore: string | null,
    @Query("agentId") agentId: string | undefined,
    @Req() req: Request
  ) {
    if (startingAfter && endingBefore) {
      throw new HttpException(
        new ChatSDKError("bad_request:api", "Only one of starting_after or ending_before can be provided."),
        HttpStatus.BAD_REQUEST
      );
    }
    return this.historyService.getChats(
      this.getUser(req).id,
      Number.parseInt(limit || "10", 10),
      startingAfter,
      endingBefore,
      agentId || undefined
    );
  }

  @Delete()
  @ApiOperation({ summary: "Delete all chat history" })
  @ApiResponse({ status: 200, description: "History deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async deleteAllHistory(@Req() req: Request) {
    return this.historyService.deleteAllChats(this.getUser(req).id);
  }
}


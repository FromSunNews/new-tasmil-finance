import {
  Body,
  Controller,
  Delete,
  Get,
  MessageEvent,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery, ApiParam } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { Observable } from "rxjs";
import { ChatService } from "./chat.service";
import { CreateChatDto } from "./dto/chat.dto";
import { ChatParamsDto, MessageParamsDto, UpdateChatVisibilityDto } from "./dto/chat-params.dto";
import { JwtAuthGuard } from "../auth/guards/auth.guard";
import { ChatSDKError } from "../common/errors";
import type { JwtPayload } from "../auth/auth.service";

const isProd = process.env.NODE_ENV === 'production';

@ApiTags("chat")
@ApiBearerAuth("JWT-auth")
@Controller("chat")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: isProd ? 30 : 1000, ttl: 60000 } })
export class ChatController {
  constructor(private chatService: ChatService) {}

  private getUser(req: Request): JwtPayload {
    const user = req.user as JwtPayload;
    if (!user) {
      throw new HttpException(new ChatSDKError("unauthorized:chat"), HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  @Post()
  @Sse()
  @ApiOperation({ summary: "Create a new chat stream" })
  @ApiBody({ type: CreateChatDto })
  @ApiResponse({ status: 200, description: "Chat stream created" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async createChat(@Body() dto: CreateChatDto, @Req() req: Request): Promise<Observable<{ data: string }>> {
    const user = this.getUser(req);
    
    // Validate required fields
    if (!dto.id) {
      throw new HttpException(new ChatSDKError("bad_request:chat"), HttpStatus.BAD_REQUEST);
    }
    
    if (!dto.selectedChatModel) {
      throw new HttpException(new ChatSDKError("bad_request:chat"), HttpStatus.BAD_REQUEST);
    }
    
    const requestHints = {
      latitude: null,
      longitude: null,
      city: null,
      country: (req.headers["x-vercel-ip-country"] as string) || null,
    };
      
    try {
      return await this.chatService.createChatStream(
        {
          id: dto.id,
          message: dto.message as any,
          messages: dto.messages as any,
          selectedChatModel: dto.selectedChatModel,
          selectedVisibilityType: dto.selectedVisibilityType,
          walletAddress: dto.walletAddress || user.walletAddress || undefined,
          agentId: dto.agentId || undefined,
        },
        user,
        requestHints
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;

      if (error instanceof Error && error.message?.includes("AI Gateway requires a valid credit card")) {
        throw new HttpException(new ChatSDKError("bad_request:activate_gateway"), HttpStatus.BAD_REQUEST);
      }

      console.error("[ChatController] Unhandled error in chat API:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        user: user.id,
        chatId: dto?.id || 'undefined',
        dto: dto,
      });
      
      throw new HttpException(new ChatSDKError("offline:chat"), HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Get("test-sse")
  @Sse()
  @UseGuards() // Override class-level guard
  testSse(): Observable<{ data: string }> {
    return new Observable((subscriber) => {
      subscriber.next({
        data: JSON.stringify({ message: "Hello SSE!" }),
      });
      
      setTimeout(() => {
        subscriber.complete();
      }, 1000);
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get chat by ID" })
  @ApiParam({ name: "id", type: String, description: "Chat ID" })
  @ApiResponse({ status: 200, description: "Chat retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Chat not found" })
  async getChat(@Param() params: ChatParamsDto, @Req() req: Request) {
    return this.chatService.getChatWithMessages(params.id, this.getUser(req).id);
  }

  @Get(":id/stream")
  @Sse()
  @ApiOperation({ summary: "Get resumable stream for chat" })
  @ApiParam({ name: "id", type: String, description: "Chat ID" })
  @ApiResponse({ status: 200, description: "Stream retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getStream(@Param() params: ChatParamsDto, @Req() req: Request): Promise<Observable<string> | null> {
    return this.chatService.getResumableStream(params.id, this.getUser(req).id);
  }

  @Delete()
  @ApiOperation({ summary: "Delete a chat" })
  @ApiQuery({ name: "id", required: true, type: String })
  @ApiResponse({ status: 200, description: "Chat deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async deleteChat(@Query("id") id: string, @Req() req: Request) {
    if (!id) {
      throw new HttpException(new ChatSDKError("bad_request:api"), HttpStatus.BAD_REQUEST);
    }
    return this.chatService.deleteChat(id, this.getUser(req).id);
  }

  @Delete("messages/:id/trailing")
  @ApiOperation({ summary: "Delete trailing messages from a message" })
  @ApiParam({ name: "id", type: String, description: "Message ID" })
  @ApiResponse({ status: 200, description: "Messages deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async deleteTrailingMessages(@Param() params: MessageParamsDto, @Req() req: Request) {
    return this.chatService.deleteTrailingMessages(params.id, this.getUser(req).id);
  }
}


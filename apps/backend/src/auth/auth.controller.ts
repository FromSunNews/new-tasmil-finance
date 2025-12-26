import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request, Response } from "express";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { WalletLoginDto } from "./dto/wallet-login.dto";
import { WalletNonceQueryDto } from "./dto/wallet-nonce-query.dto";

@ApiTags("auth")
@Controller("auth")
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for auth endpoints
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @ApiOperation({ summary: "Login with email and password" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string", example: "user@example.com" },
        password: { type: "string", example: "password123" },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(
      body.email,
      body.password
    );
    if (!user) {
      throw new Error("Invalid credentials");
    }
    return this.authService.login(user, "regular");
  }

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: { type: "string", example: "user@example.com" },
        password: { type: "string", example: "password123" },
      },
    },
  })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async register(@Body() body: { email: string; password: string }) {
    return this.authService.register(body.email, body.password);
  }

  @Get("guest")
  @ApiOperation({ summary: "Get guest session token" })
  @ApiResponse({ status: 200, description: "Guest session created" })
  async guest(@Res() res: Response) {
    const user = await this.authService.validateGuest();
    const result = await this.authService.login(user, "guest");
    return res.json(result);
  }

  @Get("session")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get current session" })
  @ApiResponse({ status: 200, description: "Session retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getSession(@Req() req: Request) {
    return {
      user: req.user,
    };
  }

  // Wallet Authentication Endpoints
  @Get("wallet/nonce")
  @ApiOperation({ summary: "Get wallet nonce for signature" })
  @ApiQuery({ name: "walletAddress", required: true, type: String })
  @ApiResponse({ status: 200, description: "Nonce generated" })
  @ApiResponse({ status: 400, description: "Invalid wallet address" })
  async getWalletNonce(@Query() query: WalletNonceQueryDto) {
    return this.authService.generateWalletNonce(query.walletAddress);
  }

  @Post("wallet/login")
  @ApiOperation({ summary: "Login with wallet signature" })
  @ApiBody({ type: WalletLoginDto })
  @ApiResponse({ status: 200, description: "Wallet login successful" })
  @ApiResponse({ status: 400, description: "Invalid signature or nonce expired" })
  async walletLogin(
    @Body() dto: WalletLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.walletLogin(dto, res);
  }
}


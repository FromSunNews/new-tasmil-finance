import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";

@Controller("api/auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
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
  async register(@Body() body: { email: string; password: string }) {
    return this.authService.register(body.email, body.password);
  }

  @Get("guest")
  async guest(@Res() res: Response) {
    const user = await this.authService.validateGuest();
    const result = await this.authService.login(user, "guest");
    return res.json(result);
  }

  @Get("session")
  @UseGuards(AuthGuard("jwt"))
  async getSession(@Req() req: Request) {
    return {
      user: req.user,
    };
  }
}


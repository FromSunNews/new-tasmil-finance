import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";
import type { JwtPayload } from "../auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try to extract from Authorization header first
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Fallback to cookie
        (request: Request) => {
          const token = request?.cookies?.auth_token;
          return token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.AUTH_SECRET || "secret",
    });
  }

  async validate(payload: JwtPayload) {
    return { id: payload.id, email: payload.email, type: payload.type };
  }
}


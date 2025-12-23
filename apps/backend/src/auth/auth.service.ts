import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare } from "bcrypt-ts";
import {
  createGuestUser,
  createUser,
  getUser,
  type User,
} from "@repo/db";
import { generateDummyPassword } from "@repo/db";

export type UserType = "guest" | "regular";

export interface JwtPayload {
  id: string;
  email: string;
  type: UserType;
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const users = await getUser(email);

    if (users.length === 0) {
      // Timing attack protection
      await compare(password, generateDummyPassword());
      return null;
    }

    const [user] = users;

    if (!user.password) {
      await compare(password, generateDummyPassword());
      return null;
    }

    const passwordsMatch = await compare(password, user.password);

    if (!passwordsMatch) {
      return null;
    }

    return user;
  }

  async validateGuest(): Promise<User> {
    const [guestUser] = await createGuestUser();
    return guestUser;
  }

  async login(user: User, type: UserType) {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      type,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        type,
      },
    };
  }

  async register(email: string, password: string) {
    await createUser(email, password);
    const users = await getUser(email);
    const [user] = users;
    if (!user) {
      throw new UnauthorizedException("Failed to create user");
    }
    return this.login(user, "regular");
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}


import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare } from "bcrypt-ts";
import { verifyMessage, isAddress } from "ethers";
import { randomBytes } from "crypto";
import { Response } from "express";
import {
  createGuestUser,
  createUser,
  getUser,
  type User,
  getDb,
  user,
  generateDummyPassword,
} from "../database";
import { RedisService } from "../infra/redis/redis.service";
import { WalletLoginDto } from "./dto/wallet-login.dto";

export type UserType = "guest" | "regular" | "wallet";

export interface JwtPayload {
  id: string;
  email: string;
  walletAddress?: string;
  type: UserType;
}

@Injectable()
export class AuthService {
  private readonly nonceTtl = 300; // 5 minutes

  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

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
    // Extract wallet address from email if it's a wallet user
    let walletAddress: string | undefined;
    if (type === "wallet" && user.email.startsWith("wallet:")) {
      walletAddress = user.email.replace("wallet:", "");
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      walletAddress,
      type,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        walletAddress,
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

  // Wallet Authentication Methods
  async generateWalletNonce(walletAddress: string) {
    if (!this.redisService.isAvailable()) {
      throw new BadRequestException("Redis is not available. Wallet authentication requires Redis.");
    }

    const normalized = this.normalizeWalletAddress(walletAddress);
    const nonce = randomBytes(16).toString("hex");
    const timestamp = new Date().toISOString();
    
    // Create user-friendly message
    const message = this.formatSignMessage(normalized, nonce, timestamp);
    
    // Store both nonce and message in Redis
    await this.redisService.setValue(
      this.getNonceKey(normalized),
      JSON.stringify({ nonce, message, timestamp }),
      this.nonceTtl,
    );

    return {
      walletAddress: normalized,
      nonce,
      message,
      expiresIn: this.nonceTtl,
    };
  }

  private formatSignMessage(
    walletAddress: string,
    nonce: string,
    timestamp: string,
  ): string {
    return ` Welcome to Tasmil Finance

Please sign this message to verify ownership of your wallet.

This request will not trigger any blockchain transaction or cost any gas fees.

Wallet Address: ${walletAddress}
Nonce: ${nonce}
Timestamp: ${timestamp}

By signing, you agree to our Terms of Service.`;
  }

  async walletLogin(dto: WalletLoginDto, res: Response) {
    if (!this.redisService.isAvailable()) {
      throw new BadRequestException("Redis is not available. Wallet authentication requires Redis.");
    }

    try {
      const normalizedWallet = this.normalizeWalletAddress(dto.walletAddress);
      const nonceData = await this.redisService.getValue(
        this.getNonceKey(normalizedWallet),
      );
      
      if (!nonceData) {
        throw new BadRequestException("Nonce expired or not found");
      }
      
      // Parse stored data
      let nonce: string;
      let message: string | undefined;
      
      try {
        const parsed = JSON.parse(nonceData);
        nonce = parsed.nonce;
        message = parsed.message;
      } catch {
        // Old format: just nonce string
        nonce = nonceData;
      }
      
      this.verifySignature(normalizedWallet, dto.signature, nonce, message);
      await this.redisService.delete(this.getNonceKey(normalizedWallet));

      // Find or create user with wallet address
      const walletUser = await this.ensureWalletUser(normalizedWallet);
      const loginResult = await this.login(walletUser, "wallet");
      
      // Set token in cookie
      res.cookie("auth_token", loginResult.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days
      });

      return loginResult;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      console.error("Error in walletLogin:", error);
      throw new BadRequestException("Login failed");
    }
  }

  private verifySignature(
    walletAddress: string,
    signature: string,
    nonce: string,
    storedMessage?: string,
  ) {
    try {
      // Use stored message if available, otherwise fallback to old format
      const message = storedMessage || `Tasmil Login Nonce: ${nonce}`;
      
      const recovered = verifyMessage(message, signature).toLowerCase();
      if (recovered !== walletAddress.toLowerCase()) {
        throw new UnauthorizedException("Signature does not match wallet address");
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid signature format or verification failed");
    }
  }

  private async ensureWalletUser(walletAddress: string): Promise<User> {
    const normalizedWallet = walletAddress.toLowerCase();
    
    // Use email field to store wallet address (format: wallet:0x...)
    const email = `wallet:${normalizedWallet}`;
    
    // Check if user exists using getUser function
    const existingUsers = await getUser(email);
    
    if (existingUsers.length > 0) {
      return existingUsers[0];
    }

    // Create new user with wallet address
    const db = getDb();
    const [newUser] = await db
      .insert(user)
      .values({
        email: email,
        password: null, // No password for wallet users
      } as any)
      .returning();

    if (!newUser) {
      throw new UnauthorizedException("Failed to create user");
    }

    return newUser;
  }

  private normalizeWalletAddress(address?: string): string {
    if (!address || !isAddress(address)) {
      throw new BadRequestException("Invalid wallet address");
    }
    return address.toLowerCase();
  }

  private getNonceKey(walletAddress: string): string {
    return `wallet_nonce:${walletAddress.toLowerCase()}`;
  }
}


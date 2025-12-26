import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: ReturnType<typeof createClient> | null = null;

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.log('Redis URL not provided, wallet nonce features will be disabled');
      return;
    }

    try {
      this.client = createClient({ url: redisUrl });
      this.client.on('error', (err) => console.error('Redis Client Error', err));
      await this.client.connect();
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  async setValue(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.client.isOpen) {
      throw new Error('Redis client not available');
    }
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async getValue(key: string): Promise<string | null> {
    if (!this.client || !this.client.isOpen) {
      throw new Error('Redis client not available');
    }
    return this.client.get(key);
  }

  async delete(key: string): Promise<void> {
    if (!this.client || !this.client.isOpen) {
      throw new Error('Redis client not available');
    }
    await this.client.del(key);
  }

  isAvailable(): boolean {
    return this.client !== null && this.client.isOpen;
  }
}


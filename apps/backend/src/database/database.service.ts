import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { initDb } from "@repo/db";

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private db: ReturnType<typeof initDb> | null = null;

  onModuleInit() {
    // Initialize database when module loads
    const connectionString = process.env.POSTGRES_URL;
    if (connectionString) {
      this.logger.log("Initializing database connection...");
      this.db = initDb(connectionString);
      this.logger.log("Database connection initialized");
    } else {
      this.logger.warn("POSTGRES_URL not set, database will be initialized lazily");
    }
  }

  getDb(): ReturnType<typeof initDb> {
    if (!this.db) {
      const connectionString = process.env.POSTGRES_URL;
      if (!connectionString) {
        this.logger.error("POSTGRES_URL environment variable is required");
        throw new Error("POSTGRES_URL environment variable is required. Please set it in your environment variables.");
      }
      this.logger.log("Initializing database connection (lazy)...");
      this.db = initDb(connectionString);
      this.logger.log("Database connection initialized");
    }
    return this.db;
  }
}


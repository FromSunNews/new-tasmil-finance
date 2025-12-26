ALTER TABLE "Chat" ADD COLUMN "agentId" varchar(255);--> statement-breakpoint
ALTER TABLE "Chat" DROP COLUMN IF EXISTS "lastContext";
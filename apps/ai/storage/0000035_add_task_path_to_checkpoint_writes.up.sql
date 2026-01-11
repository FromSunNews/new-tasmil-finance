-- Add task_path column to checkpoint_writes table for langgraph-checkpoint-postgres 3.0.0 compatibility
ALTER TABLE checkpoint_writes ADD COLUMN IF NOT EXISTS task_path TEXT NOT NULL DEFAULT '';

-- Add context and description columns to assistant table
ALTER TABLE assistant ADD COLUMN IF NOT EXISTS context jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE assistant ADD COLUMN IF NOT EXISTS description text;

-- Add context and description columns to assistant_versions table
ALTER TABLE assistant_versions ADD COLUMN IF NOT EXISTS context jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE assistant_versions ADD COLUMN IF NOT EXISTS description text;

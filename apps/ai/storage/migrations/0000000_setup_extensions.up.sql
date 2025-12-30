-- Setup required PostgreSQL extensions
-- This migration must run before any other migrations

-- Drop existing extensions if they exist (in case they were installed in wrong schema)
DROP EXTENSION IF EXISTS btree_gin CASCADE;
DROP EXTENSION IF EXISTS ltree CASCADE;
DROP EXTENSION IF EXISTS vector CASCADE;

-- Create the extensions in the correct schema
CREATE EXTENSION IF NOT EXISTS vector SCHEMA public;
CREATE EXTENSION IF NOT EXISTS btree_gin SCHEMA public;
CREATE EXTENSION IF NOT EXISTS ltree SCHEMA public;

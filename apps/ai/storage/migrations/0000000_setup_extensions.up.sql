-- Setup required PostgreSQL extensions
-- This migration must run before any other migrations
-- Modified for Azure PostgreSQL compatibility - all extensions disabled

-- Note: Azure PostgreSQL has limited extension support
-- Most extensions are not available or require special permissions
-- Running without extensions for compatibility

-- Extensions that would be nice to have but not supported:
-- - btree_gin: Not allow-listed in Azure PostgreSQL
-- - vector: May not be available
-- - ltree: May require special permissions

-- For now, we'll run without these extensions
-- The application should handle missing extensions gracefully

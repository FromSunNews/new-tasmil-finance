#!/bin/bash

# Script to update imports in frontend components
# This updates common import paths from ai-chatbot to tasmil-monorepo structure

FRONTEND_DIR="apps/frontend"

echo "Updating imports in frontend..."

# Update @/lib/db imports to @repo/db
find "$FRONTEND_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|from "@/lib/db|from "@repo/db|g' {} \;

# Update @/lib/errors imports to @repo/api
find "$FRONTEND_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|from "@/lib/errors|from "@repo/api|g' {} \;

# Update @/lib/types imports to @repo/api
find "$FRONTEND_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|from "@/lib/types|from "@repo/api|g' {} \;

# Update @/lib/utils imports (keep local, but may need adjustments)
# find "$FRONTEND_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|from "@/lib/utils|from "@/lib/utils|g' {} \;

echo "Import updates complete!"


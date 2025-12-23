# Environment Variables for Frontend

## Required Variables

None - all variables have defaults for local development.

## Optional Variables

### `NEXT_PUBLIC_API_URL`
- **Description**: Backend API server URL
- **Default**: `http://localhost:3000`
- **Required**: No
- **Example**: 
  - Development: `http://localhost:3000`
  - Production: `https://api.yourdomain.com`
- **Note**: Must start with `NEXT_PUBLIC_` to be accessible in the browser

### `NEXT_PUBLIC_APP_URL`
- **Description**: Public URL of the frontend application
- **Default**: `http://localhost:3001`
- **Required**: No
- **Example**:
  - Development: `http://localhost:3001`
  - Production: `https://yourdomain.com`
- **Note**: Used for metadata and SEO. Must start with `NEXT_PUBLIC_` to be accessible in the browser

### `NODE_ENV`
- **Description**: Node.js environment mode
- **Values**: `development`, `production`, `test`
- **Default**: `development`
- **Required**: No
- **Note**: Automatically set by Next.js build process

## Testing Variables

These are only needed when running Playwright tests:

- `PLAYWRIGHT_TEST_BASE_URL`
- `PLAYWRIGHT`
- `CI_PLAYWRIGHT`

## Quick Start

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update the values in `.env.local` with your actual configuration

3. For local development, you can use defaults (no `.env.local` needed):
   - Backend API: `http://localhost:3000`
   - Frontend App: `http://localhost:3001`

## Important Notes

- All environment variables that need to be accessible in the browser **must** start with `NEXT_PUBLIC_`
- Next.js automatically loads `.env.local`, `.env.development`, `.env.production` files
- Variables in `.env.local` override `.env` files
- Never commit `.env.local` to version control (it's in `.gitignore`)


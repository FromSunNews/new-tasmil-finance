# Environment Variables for Backend

## Required Variables

### `POSTGRES_URL`
- **Description**: PostgreSQL database connection string
- **Format**: `postgresql://user:password@host:port/database`
- **Example**: `postgresql://postgres:password@localhost:5432/tasmil`
- **Required**: Yes (but app will start without it, only fails when database is accessed)

## Optional Variables

### `REDIS_URL`
- **Description**: Redis connection string for resumable streams
- **Format**: `redis://host:port` or `redis://:password@host:port`
- **Example**: `redis://localhost:6379`
- **Required**: No (resumable streams will be disabled if not provided)
- **Note**: If not set, you'll see: "Resumable streams are disabled due to missing REDIS_URL"

### `FRONTEND_URL`
- **Description**: Frontend application URL for CORS configuration
- **Default**: `http://localhost:3001`
- **Required**: No
- **Example**: `http://localhost:3001` (development) or `https://yourdomain.com` (production)

### `PORT` or `BACKEND_PORT`
- **Description**: Port number for the backend server
- **Default**: `3000`
- **Required**: No
- **Example**: `3000` (development) or `8080` (production)
- **Note**: `BACKEND_PORT` takes precedence if both are set

### `AUTH_SECRET`
- **Description**: Secret key for JWT token signing and verification
- **Default**: `"secret"` (not secure, only for development)
- **Required**: No (but highly recommended for production)
- **How to generate**: `openssl rand -base64 32`
- **Note**: Use a strong random string in production

### `NODE_ENV`
- **Description**: Node.js environment mode
- **Values**: `development`, `production`, `test`
- **Default**: `development`
- **Required**: No
- **Note**: Affects telemetry and other production features

### `OPENAI_API_KEY`
- **Description**: OpenAI API key for AI model access
- **Format**: `sk-...`
- **Example**: `sk-proj-...`
- **Required**: Yes (if using OpenAI models)
- **How to get**: Create an API key at https://platform.openai.com/api-keys
- **Note**: This replaces the need for `AI_GATEWAY_API_KEY` when using OpenAI provider directly

## Testing Variables

These are only needed when running Playwright tests:

- `PLAYWRIGHT_TEST_BASE_URL`
- `PLAYWRIGHT`
- `CI_PLAYWRIGHT`

## Quick Start

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` with your actual configuration

3. For local development, minimum required:
   ```env
   POSTGRES_URL=postgresql://postgres:password@localhost:5432/tasmil
   AUTH_SECRET=your-secret-key-here
   ```


# Migration Guide: ai-chatbot to tasmil-monorepo

## Overview

This document describes the migration from the `ai-chatbot` Next.js application to the `tasmil-monorepo` structure with separate backend (NestJS) and frontend (Next.js) applications.

## Architecture Changes

### Before (ai-chatbot)
- Single Next.js application
- API routes in `app/api/`
- Database queries in `lib/db/`
- AI SDK integrated in Next.js route handlers

### After (tasmil-monorepo)
- **Backend**: NestJS API (`apps/backend`)
- **Frontend**: Next.js UI (`apps/frontend`)
- **Shared Packages**: 
  - `packages/db` - Database schema and queries
  - `packages/api` - Shared types and DTOs
  - `packages/ui` - Shared UI components

## Setup Instructions

### 1. Install Dependencies

```bash
cd tasmil-monorepo
pnpm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` in the root and configure:

```bash
cp .env.example .env.local
```

Required variables:
- `POSTGRES_URL` - PostgreSQL connection string
- `AUTH_SECRET` - JWT secret
- `NEXT_PUBLIC_API_URL` - Backend API URL (for frontend)

### 3. Database Setup

```bash
# Generate migrations (if needed)
cd packages/db
pnpm db:generate

# Run migrations
pnpm db:migrate
```

### 4. Start Development Servers

```bash
# From root
pnpm dev

# Or individually:
# Backend (port 3000)
cd apps/backend
pnpm dev

# Frontend (port 3001)
cd apps/frontend
pnpm dev
```

## API Endpoints

### Backend (NestJS) - Port 3000

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/guest` - Guest user creation
- `GET /api/auth/session` - Get current session
- `POST /api/chat` - Create chat (SSE stream)
- `GET /api/chat/:id/stream` - Resume stream
- `DELETE /api/chat` - Delete chat
- `GET /api/history` - Get chat history
- `DELETE /api/history` - Delete all chats
- `GET /api/document` - Get document
- `POST /api/document` - Create document
- `POST /api/files/upload` - Upload file
- `GET /api/suggestions` - Get suggestions
- `GET /api/vote` - Get votes
- `PATCH /api/vote` - Vote on message

### Frontend (Next.js) - Port 3001

- All UI routes remain the same
- Components updated to use backend API

## Key Changes

### Authentication

- **Before**: NextAuth.js with Next.js route handlers
- **After**: Passport.js with JWT in NestJS
- Frontend uses JWT tokens stored in localStorage

### API Calls

- **Before**: Direct fetch to Next.js API routes
- **After**: Use `apiClient` from `lib/api/client.ts`
- All API calls go through the backend at `NEXT_PUBLIC_API_URL`

### Database

- **Before**: Direct database access from Next.js
- **After**: Database access only from backend
- Frontend accesses data through API only

### Streaming

- **Before**: Next.js route handlers with Server-Sent Events
- **After**: NestJS controllers with `@Sse()` decorator
- Uses RxJS Observables for SSE streams

## Migration Checklist

- [x] Create shared packages (db, api)
- [x] Setup backend database module
- [x] Implement authentication module
- [x] Create chat module with AI SDK streaming
- [x] Implement remaining modules (document, files, history, suggestions, vote)
- [x] Create frontend API client
- [ ] Copy and update frontend components
- [ ] Update all API calls in components
- [ ] Setup authentication context/provider
- [ ] Test end-to-end flows
- [ ] Update environment variables
- [ ] Run database migrations

## Troubleshooting

### Backend won't start
- Check `POSTGRES_URL` is set correctly
- Ensure database is running
- Check port 3000 is available

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is set to `http://localhost:3000`
- Check CORS configuration in backend
- Ensure backend is running

### Authentication issues
- Verify JWT secret is set
- Check token is being stored in localStorage
- Ensure Authorization header is being sent

### Streaming not working
- Check Redis URL if using resumable streams
- Verify SSE endpoint is accessible
- Check browser console for errors

## Next Steps

1. Copy remaining components from `ai-chatbot/components/` to `apps/frontend/components/`
2. Update all imports to use new API client
3. Setup authentication provider/context
4. Test all features end-to-end
5. Update documentation


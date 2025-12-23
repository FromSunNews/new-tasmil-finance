# Next Steps for Migration Completion

## Immediate Actions Required

### 1. Install Dependencies
```bash
cd tasmil-monorepo
pnpm install
```

This will install all packages including:
- Backend dependencies (NestJS, AI SDK, etc.)
- Frontend dependencies (Next.js, React, etc.)
- Shared package dependencies

### 2. Setup Environment Variables

Create `.env.local` in the root directory:
```bash
cp .env.example .env.local
```

Required variables:
- `POSTGRES_URL` - Your PostgreSQL connection string
- `AUTH_SECRET` - A secure random string for JWT
- `NEXT_PUBLIC_API_URL` - Backend URL (default: `http://localhost:3000`)
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token (if using file uploads)
- `REDIS_URL` - Redis connection (optional, for resumable streams)

### 3. Run Database Migrations

```bash
cd packages/db
pnpm db:migrate
```

This will apply all database migrations from `ai-chatbot`.

### 4. Test Backend

```bash
cd apps/backend
pnpm dev
```

Backend should start on port 3000. Test endpoints:
- `GET http://localhost:3000/api/auth/guest` - Should create guest user
- Check console for any errors

### 5. Copy Frontend Components

Copy components from `ai-chatbot` to `apps/frontend`:

```bash
# Copy components
cp -r ai-chatbot/components/* tasmil-monorepo/apps/frontend/components/

# Copy hooks
cp -r ai-chatbot/hooks/* tasmil-monorepo/apps/frontend/hooks/

# Copy artifacts
cp -r ai-chatbot/artifacts/* tasmil-monorepo/apps/frontend/artifacts/
```

### 6. Update Component Imports

After copying, update imports in components:

**Before:**
```typescript
import { fetcher } from "@/lib/utils";
import { ChatSDKError } from "@/lib/errors";
```

**After:**
```typescript
import { apiClient } from "@/lib/api/client";
import { ChatSDKError } from "@repo/api";
```

### 7. Update API Calls

Replace all direct API calls with `apiClient`:

**Before:**
```typescript
const response = await fetch("/api/chat", { ... });
```

**After:**
```typescript
import { chatApi } from "@/lib/api/chat";
const stream = await chatApi.createChat({ ... });
```

### 8. Update useChat Hook

Replace `useChat` from `@ai-sdk/react` with custom `useChatApi`:

**Before:**
```typescript
const { messages, sendMessage } = useChat({ ... });
```

**After:**
```typescript
import { useChatApi } from "@/hooks/use-chat-api";
const { messages, sendMessage } = useChatApi({ ... });
```

### 9. Setup Authentication Context

Create an auth context/provider:

```typescript
// apps/frontend/contexts/auth-context.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/api/auth";

const AuthContext = createContext<{
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.init();
    // Load user from token
    authApi.getSession()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { user } = await authApi.login({ email, password });
    setUser(user);
  };

  const register = async (email: string, password: string) => {
    const { user } = await authApi.register({ email, password });
    setUser(user);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
```

### 10. Update Root Layout

Wrap app with AuthProvider:

```typescript
// apps/frontend/app/layout.tsx
import { AuthProvider } from "@/contexts/auth-context";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 11. Copy and Update Pages

Copy pages from `ai-chatbot/app/` to `apps/frontend/app/`:

- `app/(chat)/chat/[id]/page.tsx` - Update to use new API
- `app/(auth)/login/page.tsx` - Update to use auth API
- `app/(auth)/register/page.tsx` - Update to use auth API

### 12. Test End-to-End

1. Start backend: `cd apps/backend && pnpm dev`
2. Start frontend: `cd apps/frontend && pnpm dev`
3. Test flows:
   - Guest user creation
   - User registration/login
   - Chat creation and streaming
   - File upload
   - Document creation

## Common Issues & Solutions

### Issue: "Cannot find module '@repo/db'"
**Solution:** Run `pnpm install` in root directory

### Issue: "Database not initialized"
**Solution:** Ensure `POSTGRES_URL` is set and database is running

### Issue: "CORS error"
**Solution:** Check `FRONTEND_URL` in backend `.env` matches frontend URL

### Issue: "Streaming not working"
**Solution:** 
- Check Redis URL if using resumable streams
- Verify SSE endpoint is accessible
- Check browser console for errors

### Issue: "Authentication token invalid"
**Solution:**
- Verify `AUTH_SECRET` is set
- Check token is being stored in localStorage
- Ensure Authorization header is sent

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Guest user can be created
- [ ] User can register
- [ ] User can login
- [ ] Chat can be created
- [ ] Messages stream correctly
- [ ] Files can be uploaded
- [ ] Documents can be created
- [ ] Suggestions work
- [ ] Voting works
- [ ] History loads correctly

## Performance Optimization

After migration is complete:

1. **Bundle Analysis**: Check bundle sizes
2. **API Optimization**: Add caching where appropriate
3. **Database Indexing**: Ensure proper indexes on frequently queried fields
4. **Streaming Optimization**: Monitor streaming performance

## Documentation Updates

- [ ] Update main README with new architecture
- [ ] Document API endpoints
- [ ] Create deployment guide
- [ ] Update development setup instructions


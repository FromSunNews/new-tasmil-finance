# Final Migration Checklist

## ✅ Completed

### Backend (100%)
- [x] Database module
- [x] Authentication module
- [x] Chat module with AI streaming
- [x] AI module (providers, prompts, tools)
- [x] Document, Files, History, Suggestions, Vote modules
- [x] CORS configuration
- [x] All modules integrated

### Shared Packages (100%)
- [x] `packages/db` - Schema, queries, utils, migrations
- [x] `packages/api` - Types, errors, DTOs

### Frontend Infrastructure (90%)
- [x] API client setup
- [x] All API functions (auth, chat, document, files, etc.)
- [x] Utils functions
- [x] Auth context/provider
- [x] Layout updated
- [x] Components copied
- [x] Hooks copied
- [x] Artifacts copied
- [x] Pages copied
- [x] Basic import updates

## ⚠️ Remaining Tasks

### 1. Update All Imports (High Priority)
- [ ] Run `./scripts/update-imports.sh`
- [ ] Manually update remaining imports in components
- [ ] Fix any TypeScript errors

### 2. Update API Calls in Components (High Priority)
- [ ] Replace all `fetch("/api/...")` with API functions
- [ ] Update `useChat` to use custom transport
- [ ] Update vote API calls
- [ ] Update history API calls
- [ ] Update file upload calls

### 3. Update Authentication (Medium Priority)
- [ ] Update login page to use `authApi.login()`
- [ ] Update register page to use `authApi.register()`
- [ ] Update guest flow to use `authApi.guest()`
- [ ] Remove NextAuth dependencies

### 4. Fix Pages (Medium Priority)
- [ ] Update `app/chat/[id]/page.tsx` to fetch chat from API
- [ ] Update `app/page.tsx` if needed
- [ ] Update login/register pages

### 5. Dependencies & Setup (High Priority)
- [ ] Run `pnpm install` in root
- [ ] Create `.env.local` files
- [ ] Setup database connection
- [ ] Run migrations: `cd packages/db && pnpm db:migrate`

### 6. Testing (High Priority)
- [ ] Test backend starts: `cd apps/backend && pnpm dev`
- [ ] Test frontend starts: `cd apps/frontend && pnpm dev`
- [ ] Test authentication flow
- [ ] Test chat creation and streaming
- [ ] Test file upload
- [ ] Test document creation
- [ ] Test all API endpoints

### 7. Cleanup (Low Priority)
- [ ] Remove unused dependencies
- [ ] Remove old NextAuth code
- [ ] Update documentation
- [ ] Add error boundaries
- [ ] Add loading states

## Quick Start Commands

```bash
# 1. Install dependencies
cd tasmil-monorepo
pnpm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# 3. Run migrations
cd packages/db
pnpm db:migrate

# 4. Update imports (optional, helps with some updates)
cd ../..
./scripts/update-imports.sh

# 5. Start development
pnpm dev
# Or individually:
# Backend: cd apps/backend && pnpm dev
# Frontend: cd apps/frontend && pnpm dev
```

## Critical Path

1. **Install dependencies** → `pnpm install`
2. **Setup environment** → Create `.env.local`
3. **Run migrations** → `cd packages/db && pnpm db:migrate`
4. **Update imports** → Run script or manually
5. **Update API calls** → Replace fetch with API functions
6. **Test** → Start both servers and test

## Known Issues

1. **Import paths**: Some components still use old import paths
2. **API calls**: Many components still use direct fetch
3. **Authentication**: Need to migrate from NextAuth to new auth
4. **Type errors**: Will appear after `pnpm install` - fix as needed

## Next Steps After Completion

1. Performance optimization
2. Add error boundaries
3. Add loading states
4. Add tests
5. Deploy to staging
6. Deploy to production


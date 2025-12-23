# Import Updates Required

## Files That Need Manual Import Updates

After copying components from `ai-chatbot`, the following imports need to be updated:

### 1. Database Imports
**Change:** `from "@/lib/db/..."` → `from "@repo/db"`

**Files affected:**
- `components/chat.tsx` ✅ (updated)
- `components/artifact.tsx`
- `components/artifact-messages.tsx`
- `components/create-artifact.tsx`
- `components/code-editor.tsx`
- `components/document-preview.tsx`
- `components/message.tsx`
- `components/message-actions.tsx`
- `components/messages.tsx`
- `components/sidebar-history.tsx`
- `components/sidebar-history-item.tsx`
- `components/text-editor.tsx`
- `components/version-footer.tsx`
- `artifacts/text/client.tsx`
- `artifacts/actions.ts`

### 2. Error Imports
**Change:** `from "@/lib/errors"` → `from "@repo/api"`

**Files affected:**
- `components/chat.tsx` ✅ (updated)

### 3. Types Imports
**Change:** `from "@/lib/types"` → `from "@repo/api"`

**Files affected:**
- `components/artifact.tsx`
- `components/artifact-messages.tsx`
- `components/chat.tsx` ✅ (updated)
- `components/create-artifact.tsx`
- `components/data-stream-provider.tsx`
- `components/message.tsx`
- `components/message-actions.tsx`
- `components/message-editor.tsx`
- `components/messages.tsx`
- `components/multimodal-input.tsx`
- `components/preview-attachment.tsx`
- `components/suggested-actions.tsx`
- `components/toolbar.tsx`
- `hooks/use-auto-resume.ts`
- `hooks/use-messages.tsx`

### 4. Utils Imports
**Keep:** `from "@/lib/utils"` (but ensure functions exist)

**Functions needed:**
- `generateUUID` ✅
- `convertToUIMessages` ✅
- `getTextFromMessage` ✅
- `fetchWithErrorHandlers` ✅
- `cn` ✅

### 5. API Calls
**Change:** Direct fetch calls → Use `apiClient` or specific API functions

**Examples:**
- `fetch("/api/chat")` → `chatApi.createChat()`
- `fetch("/api/vote")` → `voteApi.getVotes()`
- `fetch("/api/history")` → `chatApi.getHistory()`
- `fetch("/api/files/upload")` → `filesApi.uploadFile()`

## Quick Update Script

Run this to update most imports automatically:

```bash
cd tasmil-monorepo
./scripts/update-imports.sh
```

Then manually update:
1. API calls to use `apiClient` or specific API functions
2. `useChat` hook to use custom transport
3. Authentication to use `useAuth` hook

## Component-Specific Updates

### chat.tsx
- ✅ Updated imports
- ✅ Updated vote API call
- ✅ Updated transport to use `chatApi`

### Other Components
- Need to update API calls individually
- Replace `fetcher` with specific API functions
- Update authentication checks

## Testing After Updates

1. Check for TypeScript errors: `pnpm check-types`
2. Check for linting errors: `pnpm lint`
3. Test each component individually
4. Test API integration


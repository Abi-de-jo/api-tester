# API Tester MVP — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan.

**Goal:** A lightweight API testing tool for sending GET/POST requests with a proxy to avoid CORS, JSON editor, headers, response display, and request history.

**Architecture:** Next.js App Router. Frontend is a single-page form UI. Backend is a Next.js API route (`/api/proxy`) that forwards requests server-side using native fetch() to bypass CORS. All state is local (React state + LocalStorage).

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS v4, shadcn/ui (radix-based), Monaco Editor (@monaco-editor/react), Lucide icons, sonner for toasts.

---

## Task 1: Scaffold Next.js project + shadcn/ui init

**Objective:** Create the Next.js project with TypeScript and Tailwind, then init shadcn/ui.

**Steps:**
1. `npx create-next-app@latest api-tester --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm` (run from Desktop)
2. `cd api-tester && npx shadcn@latest init --defaults` (use defaults: radix base, lucide icons, nova preset)
3. `npx shadcn@latest add button input select tabs card separator badge sonner textarea` — all the components we need
4. Verify: `npm run build` passes

**Checkpoint:** Clean Next.js app with shadcn installed.

---

## Task 2: Add Monaco Editor + build proxy API route

**Objective:** Install Monaco Editor for the JSON body editor, and create the server-side proxy endpoint.

**Steps:**
1. `npm install @monaco-editor/react`
2. Create `/src/app/api/proxy/route.ts`:
   - Accepts POST with body: `{ url, method, headers, body }`
   - Uses native `fetch()` to forward the request
   - Returns: `{ status, statusText, headers, body, timeMs }`
   - Handles errors gracefully (network errors, invalid JSON, timeouts)
   - 10-second timeout on outbound requests
3. Verify: start dev server, test with curl to the proxy endpoint

**Checkpoint:** Proxy route works, Monaco installed.

---

## Task 3: Build the main page UI — URL bar + method selector + headers + body

**Objective:** Create the complete request builder UI on the main page.

**Files:**
- `/src/app/page.tsx` — main page
- `/src/components/request-builder.tsx` — URL input, method selector, headers, body editor
- `/src/components/header-editor.tsx` — dynamic key-value pairs for headers
- `/src/types.ts` — shared TypeScript types

**Types:**
```typescript
interface HeaderPair {
  key: string;
  value: string;
  enabled: boolean;
}

interface RequestConfig {
  url: string;
  method: "GET" | "POST";
  headers: HeaderPair[];
  body: string;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timeMs: number;
}

interface HistoryItem {
  id: string;
  timestamp: number;
  request: RequestConfig;
  response: ApiResponse;
}
```

**UI Layout (top to bottom):**
1. App title: "API Tester" with a Zap icon (lucide)
2. URL bar: full-width Input with method Select (GET/POST) prepended, and a Send button appended — use shadcn InputGroup pattern or a flex row
3. Tabs: "Headers" | "Body"
   - Headers tab: list of key-value inputs with enabled toggle, + "Add Header" button
   - Body tab: Monaco Editor (JSON mode, dark theme), only visible/active when method is POST. If GET is selected, show a message "Body not available for GET requests"
4. Send button: full-width, primary variant, with a loading spinner state while request is in flight

**Styling:**
- Dark theme (use shadcn's dark mode as default)
- Clean, minimal, developer-tool aesthetic
- Responsive: stacks on mobile

**Checkpoint:** UI renders, form is interactive, no backend logic yet.

---

## Task 4: Wire up send logic + response display

**Objective:** Connect the form to the proxy, display the response.

**Files:**
- `/src/components/request-builder.tsx` — add send handler
- `/src/components/response-viewer.tsx` — new component for displaying response

**Logic:**
1. On "Send" click:
   - Validate URL is non-empty and starts with http:// or https://
   - Filter headers to only enabled ones with non-empty keys
   - If POST, validate body is valid JSON (show toast error if not)
   - POST to `/api/proxy` with the request config
   - Set loading state
   - On response: display in ResponseViewer
   - On error: show error toast via sonner
2. ResponseViewer displays:
   - Status badge: green for 2xx, yellow for 3xx, red for 4xx/5xx
   - Response time in ms
   - Response body in Monaco Editor (read-only, JSON syntax highlighting, dark theme)
   - Response headers in a collapsible section

**Checkpoint:** Can send requests and see responses.

---

## Task 5: Request history with LocalStorage

**Objective:** Store last 20 requests and show them in a sidebar/panel.

**Files:**
- `/src/components/history-panel.tsx` — new component
- `/src/lib/history.ts` — LocalStorage CRUD helpers

**Logic:**
1. `history.ts`:
   - `getHistory(): HistoryItem[]` — read from localStorage
   - `addToHistory(item: HistoryItem): void` — prepend, cap at 20
   - `clearHistory(): void`
   - `deleteHistoryItem(id: string): void`
2. HistoryPanel:
   - Collapsible left sidebar (or bottom panel on mobile)
   - Each item shows: method badge, truncated URL, status badge, timestamp (relative)
   - Click to reload that request into the builder
   - "Clear All" button at top
   - Empty state: "No requests yet"
3. After each successful send, save to history
4. On page load, restore history

**Checkpoint:** History persists across page refreshes, max 20 items.

---

## Task 6: Final polish + build verification

**Objective:** Ensure everything works, build passes, app looks good.

**Steps:**
1. Verify `npm run build` passes with no errors
2. Test the full flow:
   - GET to https://jsonplaceholder.typicode.com/posts/1
   - POST to https://jsonplaceholder.typicode.com/posts with JSON body
   - Add custom headers
   - Check history
3. Fix any visual/UX issues
4. Ensure dark theme is consistent

**Checkpoint:** App is production-ready.

---

## Notes

- The proxy route is critical: it avoids CORS issues by making requests from the server.
- Monaco Editor is heavy (~2MB) but gives a proper code editing experience. Consider lazy loading it.
- Keep the UI minimal — this is an MVP, not Postman. No tabs within tabs, no nested modals.
- Use sonner for all toast notifications.
- All shadcn components use semantic colors (bg-background, text-muted-foreground, etc.).

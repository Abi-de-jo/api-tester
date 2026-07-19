# Release Notes

## v1.0.0 — Initial Release (2026-07-19)

### What's New

**API Tester MVP** — a lightweight API testing tool for developers.

#### Core Features
- **GET & POST requests** — test any API endpoint with a single click
- **Custom headers** — add Authorization, Content-Type, or any key-value pair
- **JSON body editor** — Monaco Editor with syntax highlighting, formatting, and validation
- **Server-side proxy** — all requests routed through Next.js API route to avoid CORS
- **Response viewer** — status code, response time (ms), and formatted JSON output
- **Request history** — last 20 requests saved in LocalStorage, collapsible sidebar

#### Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- Monaco Editor (VS Code's editor)
- Sonner (toast notifications)
- Lucide React (icons)

#### UI/UX
- Clean, dark-themed interface
- Responsive layout
- Method selector (GET/POST dropdown)
- Tabbed interface for Headers and Body
- Collapsible history panel
- Loading states and error handling

### Architecture
- **Proxy pattern:** All API requests go through `/api/proxy` server route
- **Auto Content-Type:** POST requests automatically get `Content-Type: application/json` if not set
- **Zero CORS:** Server-side fetch eliminates browser CORS restrictions
- **LocalStorage persistence:** Request history survives page refreshes

### Deployment
- Deployed to Vercel (production)
- GitHub: [Abi-de-jo/api-tester](https://github.com/Abi-de-jo/api-tester)
- Live: [api-tester-beryl.vercel.app](https://api-tester-beryl.vercel.app)

### Commits
```
c3898d9 feat: add main API tester page with send logic and response display
46cdf46 feat: add response viewer, history panel, and LocalStorage helpers
cd35dd7 feat: add proxy API route and shared TypeScript types
cf60be9 feat: add tailwind theme and layout styling
e1c8234 feat: add shadcn/ui, monaco editor, sonner, lucide dependencies
fab4954 Initial commit from Create Next App
```

---

## v1.1.0 — Feature Flags & More HTTP Methods (2026-07-19)

### What's New

**PUT, PATCH, DELETE methods** — now available behind Supabase feature flags.

#### Core Features
- **PUT / PATCH / DELETE** — full HTTP method support alongside GET and POST
- **Supabase feature flags** — PUT, PATCH, DELETE are controlled via DB-based flags
- **Method-aware body** — body editor shows for POST, PUT, and PATCH (not GET/DELETE)
- **Color-coded badges** — PATCH (orange), DELETE (red), POST/PUT (green) in history

#### Infrastructure
- **Supabase integration** — `@supabase/supabase-js` client initialized
- **Feature flags table** — `feature_flags` in Supabase with RLS and default entries
- **API route** — `/api/feature-flags` for fetching and toggling flags
- **Proxy update** — now forwards body for PUT and PATCH, auto-sets Content-Type

#### Commits
```
<commits to be added>
```

---

## v1.2.0 (planned)
- Authentication helpers (Bearer, Basic, API Key presets)
- Import cURL commands
- Request collections / saved requests

### v2.0.0 (planned)
- Environment variables
- AI-powered error explanations
- Code generation (cURL, Python, JavaScript, Go)

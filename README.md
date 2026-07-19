# API Tester

A lightweight, fast API testing tool for developers who need a clutter-free alternative to Postman.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)

**Live:** [api-tester-beryl.vercel.app](https://api-tester-beryl.vercel.app)

**Version:** v1.3.0 — user_id gated POST via Supabase allowlist

---

## Features

- **GET** — always available to everyone
- **POST** — enabled only when the entered `user_id` is in the Supabase `post_access` allowlist
- **Custom headers** — add Authorization, Content-Type, or any header
- **JSON body editor** — Monaco Editor with syntax highlighting and formatting
- **Server-side proxy** — no CORS issues; authoritative POST gate on the server
- **POST audit log** — each allowed POST is logged to `request_logs` (headers sanitized)
- **Response viewer** — status code, response time, formatted JSON output
- **Request history** — last 20 requests stored in LocalStorage
- **Clean UI** — shadcn/ui components, dark theme, responsive layout

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Code Editor | Monaco Editor |
| Toast Notifications | Sonner |
| Icons | Lucide React |
| Database | Supabase Postgres (`pg` pool) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- A Supabase project (for POST allowlist + request logs)

### Installation

```bash
git clone https://github.com/Abi-de-jo/api-tester.git
cd api-tester
npm install
cp .env.example .env.local
# fill SUPABASE_DB_URL and ENABLE_POST_METHOD
```

### Database setup (once)

Run `migrations/001_post_access.sql` in the Supabase SQL editor (or via `psql`).

Seed an allowlisted user:

```sql
INSERT INTO post_access (user_id, note) VALUES ('some-id', 'Abi');
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Tests

```bash
npm test
```

### Production Build

```bash
npm run build
npm start
```

## How It Works

1. **Enter User ID** — below the URL bar; press Enter or Tab to check access
2. **Choose method** — GET always; POST only if allowlisted
3. **Enter a URL** — paste any API endpoint
4. **Add headers** (optional) — Authorization, Content-Type, etc.
5. **Add body** (POST) — JSON payload in the Monaco editor
6. **Click Send** — request goes through server proxy (no CORS)
7. **View response** — status, timing, formatted JSON

### POST access (owner)

The allowlist **is** the feature flag. There is no `NEXT_PUBLIC_ENABLE_POST`.

1. Owner inserts rows into `post_access` via Supabase SQL editor
2. Owner gives the user their `user_id`
3. User enters that id in the UI → `/api/access` returns `{ postEnabled: true }`
4. Server proxy re-checks allowlist on every POST (client UI is UX only)
5. Successful/attempted POSTs are written to `request_logs` (best-effort)

Master kill switch (server-only): set `ENABLE_POST_METHOD=false` to 403 all POSTs.

## Project Structure

```
api-tester/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── access/route.ts    # GET ?user_id= → { postEnabled }
│   │   │   └── proxy/route.ts     # Server-side proxy + POST gate
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx               # Main UI (user_id input)
│   ├── components/
│   ├── lib/
│   │   ├── history.ts
│   │   ├── supabase-server.ts     # canUsePost, logRequest, sanitizeHeaders
│   │   ├── validate.ts            # isValidUserId
│   │   └── utils.ts
│   └── types.ts
├── migrations/001_post_access.sql
├── tests/
├── .env.example
└── package.json
```

## API Routes

### `GET /api/access?user_id=...`

- Validates `user_id` (`^[A-Za-z0-9_\-:]+$`, 1–64 chars)
- Returns `{ postEnabled: boolean }` from `post_access`

### `POST /api/proxy`

Body: `{ url, method, headers, body, user_id? }`

On **POST** method:

1. `ENABLE_POST_METHOD !== 'true'` → 403 `POST disabled`
2. Invalid/missing `user_id` → 400 `Invalid user_id`
3. Not in `post_access` → 403 `Access not granted`
4. Forward request; best-effort `logRequest` after response

**GET** method is unchanged (no user_id required).

## Future Plans

- [ ] PUT / PATCH / DELETE methods
- [ ] Authentication helpers (Bearer, Basic, API Key)
- [ ] Import cURL commands
- [ ] Request collections / saved requests
- [ ] Environment variables
- [ ] AI-powered error explanations
- [ ] Code generation (cURL, Python, JavaScript)

## License

MIT

---

Built with ❤️ by [CodeByAbi](https://github.com/Abi-de-jo)

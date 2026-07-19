# API Tester

A lightweight, fast API testing tool for developers who need a clutter-free alternative to Postman.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)

**Live:** [api-tester-beryl.vercel.app](https://api-tester-beryl.vercel.app)

---

## Features

- **GET, POST, PUT, PATCH, DELETE** — test any API endpoint with full HTTP method support
- **Custom headers** — add Authorization, Content-Type, or any header
- **JSON body editor** — Monaco Editor with syntax highlighting and formatting
- **Server-side proxy** — no CORS issues, all requests go through Next.js API route
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
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
git clone https://github.com/Abi-de-jo/api-tester.git
cd api-tester
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## How It Works

1. **Enter a URL** — paste any API endpoint
2. **Choose method** — GET, POST, PUT, PATCH, or DELETE
3. **Add headers** (optional) — Authorization, Content-Type, etc.
4. **Add body** (POST/PUT/PATCH only) — JSON editor with formatting
5. **Click Send** — request goes through server proxy (no CORS)
6. **View response** — status, timing, formatted JSON

## Project Structure

```
api-tester/
├── src/
│   ├── app/
│   │   ├── api/proxy/route.ts        # Server-side proxy (avoids CORS)
│   │   ├── api/feature-flags/route.ts # Feature flags API
│   │   ├── globals.css            # Tailwind/shadcn theme
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Main UI
│   ├── components/
│   │   ├── header-editor.tsx      # Custom headers input
│   │   ├── history-panel.tsx      # Request history sidebar
│   │   ├── response-viewer.tsx    # Response display with Monaco
│   │   └── ui/                    # shadcn/ui components
│   ├── lib/
│   │   ├── history.ts             # LocalStorage helpers
│   │   ├── supabase.ts            # Supabase client
│   │   └── utils.ts               # Utility functions
│   └── types.ts                   # Shared TypeScript types
├── .vercel/                       # Vercel project config
└── package.json
```

## API Proxy

All requests go through `/api/proxy` to avoid CORS restrictions. The proxy:

- Forwards the request method, headers, and body to the target URL
- Auto-sets `Content-Type: application/json` for POST/PUT/PATCH if missing
- Returns status code, response body, and timing data

## Feature Flags

POST method is controlled via a Supabase-backed feature flag system. GET is always available to everyone.

| Flag          | Default | Description                  |
|---------------|---------|------------------------------|
| `post_method` | off     | Enable POST requests for user|

- Flags are fetched from `/api/feature-flags` on page load
- GET is always available — no flag required
- POST requires the `post_method` flag to be enabled for the user
- Toggle flags by posting to the API or updating the `feature_flags` table in Supabase

## Future Plans

- [ ] Authentication helpers (Bearer, Basic, API Key)
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

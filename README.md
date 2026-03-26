# AI GitHub README Generator

A production-ready Next.js 14 web application that lets users sign in with GitHub, browse repositories, generate polished README.md files using Groq, preview and edit markdown live, and commit README directly to GitHub.

## Tech Stack

- Frontend: Next.js 14 App Router + TypeScript + Tailwind CSS
- Backend: Next.js route handlers (API routes)
- Auth: NextAuth (GitHub OAuth)
- AI: Groq OpenAI-compatible chat endpoint (`llama3-70b-8192`)
- Markdown rendering: `react-markdown`
- Icons: `lucide-react`
- Notifications: `sonner`

## Features

- GitHub OAuth login with secure NextAuth session
- User profile display and protected dashboard routes
- Repository listing (public/private) with search + filters
- README generation from selected repository context via Groq
- Template modes: `default`, `startup`, `ai`, `library`
- Live markdown preview + editable markdown textarea
- Copy markdown to clipboard
- Download as `README.md`
- Push directly to GitHub via:
  - `PUT /repos/{owner}/{repo}/contents/README.md`
  - Handles create and update flows automatically
- Error handling for invalid payloads, API failures, auth failures, and GitHub rate limits
- Basic SaaS-style daily generation limit (in-memory)

## Project Structure

```text
.
├─ .env.example
├─ middleware.ts
├─ src
│  ├─ app
│  │  ├─ api
│  │  │  ├─ auth/[...nextauth]/route.ts
│  │  │  ├─ repos/route.ts
│  │  │  ├─ generate/route.ts
│  │  │  └─ commit/route.ts
│  │  ├─ auth/error/page.tsx
│  │  ├─ commit/page.tsx
│  │  ├─ dashboard/loading.tsx
│  │  ├─ dashboard/page.tsx
│  │  ├─ generate/page.tsx
│  │  ├─ login/page.tsx
│  │  ├─ repos/page.tsx
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components
│  │  ├─ auth/sign-in-button.tsx
│  │  ├─ dashboard/dashboard-client.tsx
│  │  ├─ dashboard/repo-card.tsx
│  │  ├─ dashboard/repo-filters.tsx
│  │  ├─ dashboard/repo-list.tsx
│  │  ├─ generator/readme-preview.tsx
│  │  ├─ generator/readme-workspace.tsx
│  │  ├─ layout/app-background.tsx
│  │  ├─ layout/navbar.tsx
│  │  ├─ providers/session-provider.tsx
│  │  ├─ providers/toast-provider.tsx
│  │  └─ ui/loading-skeleton.tsx
│  ├─ lib
│  │  ├─ auth.ts
│  │  ├─ github.ts
│  │  ├─ groq.ts
│  │  ├─ session.ts
│  │  └─ usage-limit.ts
│  ├─ types
│  │  ├─ github.ts
│  │  ├─ next-auth.d.ts
│  │  └─ readme.ts
│  └─ utils
│     ├─ cn.ts
│     └─ download.ts
└─ public/avatar-fallback.svg
```

## Environment Variables

Create `.env.local`:

```bash
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GROQ_API_KEY=
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create GitHub OAuth App:
- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

3. Fill in `.env.local`.

4. Start development server:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Deploy on Vercel

1. Push repository to GitHub.
2. Import project in Vercel.
3. Set environment variables in Vercel project settings:
	- `GITHUB_CLIENT_ID`
	- `GITHUB_CLIENT_SECRET`
	- `NEXTAUTH_SECRET`
	- `NEXTAUTH_URL` (your production URL)
	- `GROQ_API_KEY`
4. In GitHub OAuth App settings, add production callback URL:
	- `https://YOUR_DOMAIN/api/auth/callback/github`
5. Deploy.

## Notes

- GitHub `repo` scope is required to list private repositories and commit README updates.
- Daily generation limit is currently in-memory and resets when server instance restarts.
- For production SaaS billing/limits, replace in-memory limiter with Redis or a database-backed counter.

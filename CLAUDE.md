# THE STANDARD - Video Viewing App

トレーナーメソッド The Standard の動画閲覧Webアプリ。

## Tech Stack
- Frontend: React 19 + TypeScript + Vite 8 (SWC)
- UI: TailwindCSS + shadcn/ui (subset)
- Video: hls.js (HLS) + native video (MP4)
- CDN: Bunny.net Stream (HLS adaptive)
- API: Cloudflare Pages Functions + KV
- Routing: React Router v7
- Deploy: Cloudflare Pages (primary) / Docker + Fly.io (nrt)

## Commands
- `npm run dev` — dev server (port 8080)
- `npm run dev:api` — wrangler pages functions dev (port 8788)
- `npm run build` — production build (`tsc && vite build`)
- `npm run preview` — preview production build
- `npm run deploy` — build + wrangler pages deploy

## Deploy
```bash
npm run deploy
```

## Directory Structure
```
src/
  components/ui/      — shadcn/ui base components (button, card, slider, badge)
  components/videos/  — VideoPlayer, VideoCard, MultiViewPlayer, ExerciseOverlay
  components/auth/    — PasswordGate
  components/layout/  — Header
  data/               — Static video data + types + categories
  pages/              — VideoListPage, VideoDetailPage, EmbedPage, admin/AdminPage
  lib/                — utils (cn), bunny (URL helpers), api (API client)
functions/
  api/_middleware.ts   — CORS
  api/_shared/seed.ts  — Types + seed data + URL resolution
  api/videos/          — REST endpoints (index.ts, [id].ts)
```

## Routes
- `/` — Video list (password protected)
- `/videos/:id` — Video detail (password protected)
- `/embed/:videoId` — Embed player (no auth, iframe-friendly)
- `/admin` — Video CRUD admin (password protected)
- `/api/videos` — REST API (GET list, POST create)
- `/api/videos/:id` — REST API (GET detail, PUT update, DELETE)

## Adding Videos
1. Upload to Bunny.net Stream dashboard
2. Use `/admin` to create video and link Stream IDs
3. Or edit `src/data/videos.ts` directly and redeploy

## Video Features
- HLS + MP4 dual playback
- Multi-angle sync with explicit sync button (メイン > 正面 > first angle)
- Single view with angle switcher
- Keyboard shortcuts: Space/K (play/pause), J/L (skip), F (fullscreen), M (mute)
- Playback speed: 0.25x - 2x
- Frame stepping: , / .
- Exercise overlay with chapter progress

## Testing
- `npx tsc --noEmit` — type check (frontend)
- `npx tsc --project functions/tsconfig.json --noEmit` — type check (functions)
- `npm run build` — build check
- `npx wrangler pages functions build` — functions compile check

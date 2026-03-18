# THE STANDARD - Video Viewing App

The Standard の動画閲覧Webアプリ。マルチアングル同期再生プラットフォーム。

## Tech Stack
- Frontend: React 19 + TypeScript + Vite 8 (SWC)
- UI: TailwindCSS + shadcn/ui (subset)
- Video: hls.js (HLS) + native video (MP4)
- CDN: Bunny.net Stream (Library ID: YOUR_LIBRARY_ID, HLS adaptive)
- API: Cloudflare Pages Functions + KV
- Routing: React Router v7
- Deploy: Cloudflare Pages (primary)

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
  pages/              — VideoListPage, VideoDetailPage, EmbedPage
  pages/admin/        — AdminLayout, DashboardPage, VideoListPage, VideoEditPage, VideoCreatePage
  lib/                — utils (cn), bunny (URL helpers), api (API client + auth)
functions/
  api/_middleware.ts   — CORS + Bearer token auth
  api/_shared/seed.ts  — Types + seed data + URL resolution
  api/_shared/kv.ts    — KV helpers (video:{id} + video:index, auto-migration)
  api/videos/          — REST endpoints (index.ts, [id].ts) with PATCH status
  api/admin/stats.ts   — Dashboard statistics endpoint
apps/
  ingest/              — Tauri 2.0 Mac Ingest App (SSD auto-detect → encode → upload)
public/
  subs/                — WebVTT subtitle files (Whisper-generated)
```

## Routes
- `/` — Video list (password protected)
- `/videos/:id` — Video detail with chapter panel (password protected)
- `/embed/:videoId` — Embed player (no auth, iframe-friendly, postMessage API)
- `/admin` — Dashboard (password protected)
- `/admin/videos` — Video list management
- `/admin/videos/new` — Create new video
- `/admin/videos/:id` — Edit video
- `/api/videos` — REST API (GET list, POST create). Public GET returns published only
- `/api/videos/:id` — REST API (GET detail, PUT update, PATCH status, DELETE)
- `/api/admin/stats` — Dashboard statistics (auth required)

## Adding Videos
1. Upload to Bunny.net Stream (tus protocol for large files)
2. Use `/admin` to create video and link Stream IDs
3. Or edit `src/data/videos.ts` + `functions/api/_shared/seed.ts` and redeploy

## Video Features
- HLS + MP4 dual playback
- Multi-angle sync with explicit sync button (メイン > 正面 > first angle, 0.15s threshold)
- MultiViewPlayer: forwardRef with seekTo for external control
- Single view with angle switcher
- Chapter panel: sidebar tabs (chapters/videos) + mobile accordion
- Clickable chapter dots (ExerciseOverlay onSeek)
- Keyboard shortcuts: Space/K (play/pause), J/L (skip), F (fullscreen), M (mute), ,/. (frame step)
- Double-tap gesture: left -10s / right +10s (mobile)
- Playback speed: 0.25x - 2x
- WebVTT subtitles (Whisper auto-generated)
- Mobile: responsive touch targets (40-44px), single-view + angle tabs, always-visible controls

## Video Production Pipeline
1. Shoot with A-cam (front) + B-cam (side), ProRes Log 4K 24fps
2. Export to `footage/YYYY-MM-DD/export/front/` and `side/`
3. Generate main angle: ffmpeg frame analysis → cutlist CSV → segment concat
4. Generate subtitles: `whisper --model small --language ja --condition_on_previous_text False`
5. Upload via Bunny tus API: `upload-tus.sh <file> <guid> <label>`
6. Register in videos.ts + seed.ts, deploy

## Testing
- `npx tsc --noEmit` — type check (frontend)
- `npx tsc --project functions/tsconfig.json --noEmit` — type check (functions)
- `npm run build` — build check
- `npx wrangler pages functions build` — functions compile check

## Mac Ingest App
- Location: `apps/ingest/` (Tauri 2.0 + React + Rust)
- Dev: `cd apps/ingest && npx tauri dev`
- Build: `cd apps/ingest && npx tauri build`
- Rust check: `cd apps/ingest/src-tauri && cargo check`
- Frontend check: `cd apps/ingest && npx tsc --noEmit`

## API Authentication
- Admin operations require `Authorization: Bearer <ADMIN_TOKEN>` header
- ADMIN_TOKEN is set as Cloudflare Pages environment variable
- Public GET /api/videos returns only `published` status videos
- Frontend stores token in sessionStorage (`thestandard_admin_token`)

## KV Storage Structure
- `video:{id}` — Individual video data (VideoData JSON)
- `video:index` — Ordered ID array (string[])
- Auto-migration from legacy `"videos"` single-key format

# THE STANDARD - Video Viewing App

伊野波メソッド The Standard の動画閲覧Webアプリ。

## Tech Stack
- Frontend: React 18 + TypeScript + Vite (SWC)
- UI: TailwindCSS + shadcn/ui (subset)
- Video: hls.js (HLS) + native video (MP4)
- CDN: Bunny.net Stream (HLS adaptive)
- Routing: React Router v6
- Deploy: Docker (nginx:alpine) + Fly.io (nrt)

## Commands
- `npm run dev` — dev server (port 8080)
- `npm run build` — production build (`tsc && vite build`)
- `npm run preview` — preview production build

## Deploy
```bash
fly deploy
```

## Directory Structure
```
src/
  components/ui/      — shadcn/ui base components (button, card, slider, badge)
  components/videos/  — VideoPlayer, VideoCard, MultiViewPlayer
  components/layout/  — Header
  data/               — Static video data + types + categories
  pages/              — VideoListPage, VideoDetailPage
  lib/                — utils (cn), bunny (URL helpers)
```

## Adding Videos
1. Upload to Bunny.net Stream dashboard
2. Edit `src/data/videos.ts`:
   ```typescript
   {
     id: "xxx",
     title: "...",
     category: "training",
     angles: [
       { id: "xxx-front", label: "正面", bunnyStreamId: "<stream-id>" },
       { id: "xxx-side", label: "側面", bunnyStreamId: "<stream-id>" },
     ],
   }
   ```
3. Set env: `VITE_BUNNY_CDN_HOSTNAME=your-cdn.b-cdn.net`
4. `npm run build && fly deploy`

## Video Features
- HLS + MP4 dual playback
- Multi-angle view (synced playback of 2-4 angles)
- Single view with angle switcher
- Keyboard shortcuts: Space/K (play/pause), J/L (skip), F (fullscreen), M (mute)
- Playback speed: 0.25x - 2x
- Frame stepping: , / .

## Testing
- `npx tsc --noEmit` — type check
- `npm run build` — build check

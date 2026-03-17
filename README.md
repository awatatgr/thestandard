# THE STANDARD

伊野波メソッド The Standard — マルチアングル同期再生プラットフォーム。

## ビジョン

動画IDを渡すだけで、マルチアングル同期再生が動く。

```html
<!-- iframe（最速、ゼロコード） -->
<iframe src="https://thestandard.pages.dev/embed/stretch-full?layout=equal"
        class="w-full aspect-video" allow="fullscreen" />
```

## プロダクトレイヤー

```
Layer 4: アプリケーション      — The Standard Web / actola-pro / 外部サイト
Layer 3: 埋め込み              — /embed/:id (iframe) / React SDK (将来)
Layer 2: Content API           — GET /api/videos/:id → angles + chapters
Layer 1: プレイヤーUI          — VideoPlayer / MultiViewPlayer / Overlay
```

## Tech Stack

| レイヤー | 技術 |
|---------|------|
| Frontend | React 19 + TypeScript + Vite 8 (SWC) |
| UI | TailwindCSS + shadcn/ui (subset) |
| Video | hls.js (HLS adaptive) + native video (MP4) |
| CDN | Bunny.net Stream |
| API | Cloudflare Pages Functions |
| Data | Cloudflare KV (VIDEOS_KV) |
| Deploy | Cloudflare Pages (primary) / Docker + Fly.io (nrt) |

## ルート構成

| パス | 用途 | 認証 |
|------|------|------|
| `/` | 動画一覧 (Hero + Grid) | Password |
| `/videos/:id` | 動画再生 (Single/Multi view) | Password |
| `/embed/:videoId` | iframe埋め込み用プレイヤー | なし |
| `/admin` | 動画管理 CRUD | Password |
| `GET /api/videos` | 動画一覧 JSON | なし (CORS) |
| `GET /api/videos/:id` | 動画詳細 JSON | なし (CORS) |
| `POST /api/videos` | 動画作成 | KV必須 |
| `PUT /api/videos/:id` | 動画更新 | KV必須 |
| `DELETE /api/videos/:id` | 動画削除 | KV必須 |

## コマンド

```bash
npm run dev         # Vite dev server (port 8080)
npm run dev:api     # Wrangler Pages Functions dev (port 8788)
npm run build       # tsc && vite build
npm run preview     # preview production build
npm run deploy      # build + wrangler pages deploy
```

開発時は `npm run dev` と `npm run dev:api` を並列実行。Vite が `/api` を `:8788` にプロキシします。

## ディレクトリ構成

```
src/
  components/
    auth/             — PasswordGate (セッション認証)
    layout/           — Header
    ui/               — shadcn/ui (button, card, slider, badge)
    videos/           — VideoPlayer, MultiViewPlayer, ExerciseOverlay, VideoCard
  data/               — 静的動画データ + 型 + カテゴリ
  lib/                — utils (cn), bunny (CDN URL), api (APIクライアント)
  pages/
    VideoListPage     — 動画一覧 (Hero + カテゴリフィルタ + Grid)
    VideoDetailPage   — 動画再生 (Single/Equal/MainSub)
    EmbedPage         — iframe埋め込み用軽量プレイヤー
    admin/AdminPage   — 動画管理 CRUD

functions/
  api/
    _middleware.ts    — CORS
    _shared/seed.ts   — 型定義 + シードデータ + URL解決
    videos/
      index.ts        — GET list / POST create
      [id].ts         — GET detail / PUT update / DELETE
```

## 動画プレイヤー機能

### マルチアングル同期再生
- **同期ボタン**: ONの間は全アングルをメインに常時同期 (閾値 0.15s)
- **メイン判定**: `"メイン"` ラベル → `"正面"` ラベル → 先頭アングル の優先順
- **レイアウト**: Single / Equal (並列) / Main-Sub (メイン大+サブ小)
- **個別制御**: アングルごとのPause/Mute

### 再生コントロール
- HLS + MP4 デュアル再生
- 再生速度: 0.25x — 2x
- キーボードショートカット: Space/K (再生), J/L (±10s), ←/→ (±5s), F (フルスクリーン), M (ミュート), ,/. (コマ送り)
- エクササイズオーバーレイ (チャプター名 + 進捗表示)
- WebVTT字幕

## Embed (iframe)

```
/embed/:videoId?layout=equal&subtitles=on
```

| パラメータ | 値 | デフォルト |
|-----------|-----|-----------|
| `layout` | `equal` / `main-sub` | `equal` |
| `subtitles` | `on` / `off` | `off` |

### postMessage API

```javascript
// 親ウィンドウで受信
window.addEventListener('message', (e) => {
  if (e.data.source !== 'thestandard') return;
  // e.data.type: 'thestandard:ready' | 'thestandard:timeupdate'
  // e.data.currentTime, e.data.duration
});
```

## Content API

### レスポンス例

```
GET /api/videos/inoha-stretch
```

```json
{
  "id": "inoha-stretch",
  "title": "ストレッチ＆モビリティ — フルセッション",
  "category": "training",
  "chapter": "ストレッチ",
  "durationSeconds": 612,
  "angles": [
    {
      "id": "inoha-stretch-front",
      "label": "正面",
      "hlsUrl": "https://vz-xxx.b-cdn.net/5315b34e.../playlist.m3u8",
      "thumbnailUrl": "https://vz-xxx.b-cdn.net/5315b34e.../thumbnail.jpg",
      "subtitleUrl": "/subs/stretch.vtt"
    },
    {
      "id": "inoha-stretch-side",
      "label": "側面",
      "hlsUrl": "https://vz-xxx.b-cdn.net/3d10af0b.../playlist.m3u8",
      "thumbnailUrl": "https://vz-xxx.b-cdn.net/3d10af0b.../thumbnail.jpg"
    }
  ],
  "chapters": [
    { "name": "長座体前屈", "start": 17, "end": 90 }
  ]
}
```

`hlsUrl` は解決済みのフルURL。利用側は Bunny.net の存在を知る必要がない。

## 管理画面 (/admin)

- 動画一覧 — カテゴリ / アングル数 / 再生時間 / チャプター数
- 動画の作成・編集・削除
- アングル管理 (Bunny Stream ID 紐付け)
- チャプター / エクササイズ定義
- Embed URL / iframe スニペットのコピー

## セットアップ

```bash
npm install

# フロントエンドのみ
npm run dev

# API付き（Functions含む）
npm run dev & npm run dev:api
```

### 環境変数

| 変数 | 用途 | 設定場所 |
|------|------|---------|
| `VITE_BUNNY_CDN_HOSTNAME` | Bunny CDN ホスト名 | `.env` (フロントエンド) |
| `BUNNY_CDN_HOSTNAME` | Bunny CDN ホスト名 | Cloudflare Pages 環境変数 |

### KV セットアップ (管理画面 CRUD用)

```bash
npx wrangler kv namespace create VIDEOS_KV
# 出力されたIDを wrangler.toml に設定
```

## デプロイ

```bash
npm run deploy
# → npm run build && wrangler pages deploy dist/
```

Cloudflare Pages が `dist/` (静的) + `functions/` (API) を同時デプロイ。

## ロードマップ

### Phase 1 (現在) — Embed + API + 管理画面
- [x] `/embed/:id` iframe埋め込みルート
- [x] Content API (Cloudflare Pages Functions)
- [x] `/admin` 動画管理 CRUD
- [x] 同期ボタン (メインアングル自動判定)
- [x] postMessage API

### Phase 2 — React SDK
- [ ] npm パッケージ `@thestandard/react`
- [ ] `<TheStandardPlayer videoId="..." />`
- [ ] Headless hooks: `useTheStandardPlayer()`

### Phase 3 — プラットフォーム化
- [ ] APIキー発行・管理
- [ ] Web Component `<the-standard-player>`
- [ ] 課金 (動画本数 x 視聴回数)
- [ ] 分析ダッシュボード

## 動画の追加

### 方法 1: 管理画面 (推奨)
1. Bunny.net Stream にアップロード
2. `/admin` で動画を作成し、Stream ID を紐付け

### 方法 2: コード
1. `src/data/videos.ts` に追加:
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
2. `npm run build && npm run deploy`

## テスト

```bash
npx tsc --noEmit                                    # 型チェック (frontend)
npx tsc --project functions/tsconfig.json --noEmit   # 型チェック (functions)
npm run build                                        # ビルド確認
npx wrangler pages functions build                   # Functions コンパイル確認
```

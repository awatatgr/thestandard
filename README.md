# THE STANDARD

The Standard — マルチアングル同期再生プラットフォーム。

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
| CDN | Bunny.net Stream (Library ID: YOUR_LIBRARY_ID) |
| API | Cloudflare Pages Functions |
| Data | Cloudflare KV (VIDEOS_KV) |
| Deploy | Cloudflare Pages (primary) |

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
    VideoDetailPage   — 動画再生 (Single/Equal/MainSub + チャプターパネル)
    EmbedPage         — iframe埋め込み用軽量プレイヤー
    admin/AdminPage   — 動画管理 CRUD

functions/
  api/
    _middleware.ts    — CORS
    _shared/seed.ts   — 型定義 + シードデータ + URL解決
    videos/
      index.ts        — GET list / POST create
      [id].ts         — GET detail / PUT update / DELETE

public/
  subs/               — WebVTT字幕ファイル (Whisper生成)
```

## 動画プレイヤー機能

### マルチアングル同期再生
- **同期ボタン**: ONの間は全アングルをメインに常時同期 (閾値 0.15s)
- **メイン判定**: `"メイン"` ラベル → `"正面"` ラベル → 先頭アングル の優先順
- **レイアウト**: Single / Equal (並列) / Main-Sub (メイン大+サブ小)
- **個別制御**: アングルごとのPause/Mute
- **MultiViewPlayer ref**: forwardRef + `seekTo` で外部からシーク可能

### 再生コントロール
- HLS + MP4 デュアル再生
- 再生速度: 0.25x — 2x
- キーボードショートカット: Space/K (再生), J/L (±10s), ←/→ (±5s), F (フルスクリーン), M (ミュート), ,/. (コマ送り)
- ダブルタップジェスチャー: 左半分 -10s / 右半分 +10s (モバイル)
- エクササイズオーバーレイ (チャプター名 + 進捗ドット、クリックでジャンプ)
- WebVTT字幕 (Whisper自動生成)

### チャプターパネル
- サイドバーに「チャプター」「動画一覧」タブ切替
- チャプタークリックで再生位置ジャンプ (Single/Multi両対応)
- 再生中のチャプターがリアルタイムでハイライト
- モバイル: 動画下に折りたたみアコーディオン

### モバイル最適化
- タッチターゲット: 全ボタン 40-44px (モバイル) / 32-36px (デスクトップ)
- シークバーthumb: 24px (モバイル) / 16px (デスクトップ)
- マルチビュー: モバイルではシングル表示 + アングルタブ切替
- 個別操作ボタン: モバイルでは常時表示 (デスクトップはhover)
- フォントサイズ: 12px以上を保証

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

### actola-pro 組み込み

```tsx
function TheStandardEmbed({ videoId }: { videoId: string }) {
  return (
    <iframe
      src={`https://thestandard.pages.dev/embed/${videoId}?layout=equal`}
      className="w-full aspect-video rounded-lg"
      allow="fullscreen"
      frameBorder="0"
    />
  );
}
```

## Content API

### レスポンス例

```
GET /api/videos/trainer-session
```

```json
{
  "id": "trainer-session",
  "title": "トレーナー運動指導セッション",
  "category": "method",
  "durationSeconds": 795,
  "angles": [
    {
      "id": "trainer-session-main",
      "label": "メイン",
      "hlsUrl": "https://vz-xxx.b-cdn.net/.../playlist.m3u8",
      "thumbnailUrl": "https://vz-xxx.b-cdn.net/.../thumbnail.jpg",
      "subtitleUrl": "/subs/trainer-session.vtt"
    },
    {
      "id": "trainer-session-front",
      "label": "正面",
      "hlsUrl": "https://vz-xxx.b-cdn.net/.../playlist.m3u8"
    },
    {
      "id": "trainer-session-side",
      "label": "側面",
      "hlsUrl": "https://vz-xxx.b-cdn.net/.../playlist.m3u8"
    }
  ],
  "chapters": [
    { "name": "導入・ウォームアップ", "start": 0, "end": 30 },
    { "name": "開脚ストレッチ", "start": 165, "end": 195 }
  ]
}
```

## 管理画面 (/admin)

- 動画一覧 — カテゴリ / アングル数 / 再生時間 / チャプター数
- 動画の作成・編集・削除
- アングル管理 (Bunny Stream ID 紐付け)
- チャプター / エクササイズ定義
- Embed URL / iframe スニペットのコピー

## 登録済み動画

| ID | タイトル | カテゴリ | アングル | 長さ | チャプター |
|----|---------|---------|---------|------|-----------|
| `stretch-full` | ストレッチ＆モビリティ — フルセッション | training | 正面, 側面 | 10:12 | - |
| `running-form` | トレッドミルでランニングフォーム分析 | training | 正面, 側面 | 1:39 | - |
| `warmup-stretch` | ウォームアップ＆ストレッチ | training | 正面, 側面 | 2:17 | - |
| `treadmill-run` | トレッドミルランニング | training | 正面, 側面 | 3:35 | - |
| `squat-lunge` | バーベルスクワット＆ランジ | drill | 正面, 側面 | 3:17 | - |
| `stretch-3view` | ストレッチ＆モビリティ 3画面 | method | メイン, 正面, 側面 | 10:12 | 16 |
| `trainer-session` | トレーナー運動指導セッション | method | メイン, 正面, 側面 | 13:15 | 15 |

## セットアップ

```bash
npm install
npm run dev                    # フロントエンドのみ
npm run dev & npm run dev:api  # API付き
```

### 環境変数

| 変数 | 用途 | 設定場所 |
|------|------|---------|
| `VITE_BUNNY_CDN_HOSTNAME` | Bunny CDN ホスト名 | `.env` |
| `BUNNY_CDN_HOSTNAME` | Bunny CDN ホスト名 | Cloudflare Pages 環境変数 |

### KV セットアップ (管理画面 CRUD用)

```bash
npx wrangler kv namespace create VIDEOS_KV
# wrangler.toml にIDを設定
```

## デプロイ

```bash
npm run deploy
```

Cloudflare Pages が `dist/` (静的) + `functions/` (API) を同時デプロイ。

## 動画制作ワークフロー

### 撮影 → 編集 → 公開

1. **撮影**: A-cam (正面) + B-cam (側面) で同時収録 (ProRes Log 4K 24fps)
2. **データ転送**: SSD → PC (`footage/YYYY-MM-DD/`)
3. **エクスポート**: DaVinci Resolve or 直接エクスポート → `export/front/`, `export/side/`
4. **メイン映像生成** (任意): ffmpegでカットリストから正面/側面を自動切替合成
5. **字幕生成**: Whisper (`--model small --language ja --condition_on_previous_text False`)
6. **アップロード**: Bunny.net Stream API (tus protocol)
7. **登録**: `src/data/videos.ts` + `functions/api/_shared/seed.ts` にエントリ追加
8. **デプロイ**: `npm run deploy`

### ffmpegメイン映像合成

```bash
# カットリストCSV (start,end,source)
# front = 説明・トーク、side = フォーム実演
/tmp/thestandard-edit/edit-main.sh cutlist.csv front.mp4 side.mp4 output.mp4
```

### Bunny.net tusアップロード

```bash
/tmp/thestandard-edit/upload-tus.sh <file.mp4> <video-guid> <label>
```

## ロードマップ

### Phase 1 (完了) — Embed + API + 管理画面 + モバイル最適化
- [x] `/embed/:id` iframe埋め込みルート
- [x] Content API (Cloudflare Pages Functions)
- [x] `/admin` 動画管理 CRUD
- [x] 同期ボタン (メインアングル自動判定)
- [x] postMessage API
- [x] チャプターパネル (サイドバータブ + モバイルアコーディオン)
- [x] クリック可能チャプタードット
- [x] モバイルUX (タッチターゲット, レスポンシブレイアウト, ダブルタップ)
- [x] ffmpegによるメイン映像自動合成
- [x] Whisperによる自動字幕生成

### Phase 2 — React SDK
- [ ] npm パッケージ `@thestandard/react`
- [ ] `<TheStandardPlayer videoId="..." />`
- [ ] Headless hooks: `useTheStandardPlayer()`

### Phase 3 — プラットフォーム化
- [ ] APIキー発行・管理
- [ ] Web Component `<the-standard-player>`
- [ ] 課金 (動画本数 x 視聴回数)
- [ ] 分析ダッシュボード

## テスト

```bash
npx tsc --noEmit                                    # 型チェック (frontend)
npx tsc --project functions/tsconfig.json --noEmit   # 型チェック (functions)
npm run build                                        # ビルド確認
npx wrangler pages functions build                   # Functions コンパイル確認
```

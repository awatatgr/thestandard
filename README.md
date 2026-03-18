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
| `/embed/:videoId` | リッチ版 embed (レイアウト/チャプター/字幕UI付き) | なし |
| `/embed/:videoId?controls=minimal` | シンプル版 embed (映像のみ, postMessage制御) | なし |
| `/open-source` | OSS紹介LP | なし |
| `/admin` | ダッシュボード | Password + Bearer |
| `/admin/videos` | 動画一覧 (検索/フィルター/サムネイル) | Password + Bearer |
| `/admin/videos/new` | 動画新規作成 | Password + Bearer |
| `/admin/videos/:id` | 動画編集 | Password + Bearer |
| `GET /api/videos` | 動画一覧 JSON (公開: publishedのみ) | なし (CORS) |
| `GET /api/videos/:id` | 動画詳細 JSON (公開: publishedのみ) | なし (CORS) |
| `POST /api/videos` | 動画作成 | Bearer token |
| `PUT /api/videos/:id` | 動画更新 | Bearer token |
| `PATCH /api/videos/:id` | ステータス変更 | Bearer token |
| `DELETE /api/videos/:id` | 動画削除 | Bearer token |
| `GET /api/admin/stats` | 統計サマリー | Bearer token |

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
    EmbedPage         — iframe埋め込み (リッチ版 / シンプル版)
    admin/
      AdminLayout     — サイドバー付き管理画面レイアウト
      DashboardPage   — KPIカード + 最近の更新
      VideoListPage   — 動画一覧 (検索/フィルター/ステータス)
      VideoEditPage   — 動画編集
      VideoCreatePage — 動画新規作成

functions/
  api/
    _middleware.ts    — CORS + Bearer token認証
    _shared/
      seed.ts         — 型定義 + シードデータ + URL解決
      kv.ts           — KVヘルパー (video:{id} + 自動マイグレーション)
    videos/
      index.ts        — GET list / POST create
      [id].ts         — GET detail / PUT update / PATCH status / DELETE
    admin/
      stats.ts        — GET 統計サマリー

apps/
  ingest/             — Mac Ingest App (Tauri 2.0 + React + Rust)

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

2つのモードを用意。組み込み側の要件に応じて使い分ける。

### リッチ版（デフォルト）

```
/embed/:videoId
```

レイアウト切替・チャプターナビ・字幕トグルのUIコントロールを **iframe内に全て含む**。
組み込み先は `<iframe>` を貼るだけでフル機能が動く。

```html
<iframe src="https://thestandard.pages.dev/embed/trainer-session"
        class="w-full aspect-video" allow="fullscreen" frameborder="0" />
```

**iframe内のコントロール:**
- レイアウト切替（シングル / 均等 / メイン+サブ）
- 字幕 ON/OFF トグル
- チャプターリスト（折りたたみ式、クリックでシーク）
- 現在チャプター表示（番号 + 名前）
- シングルビュー時のアングルタブ切替
- ExerciseOverlay（チャプタードット進捗）

### シンプル版

```
/embed/:videoId?controls=minimal
```

映像のみ表示。外部から postMessage で制御可能。
組み込み先が **独自UIを構築したい場合** に使用。

| パラメータ | 値 | デフォルト |
|-----------|-----|-----------|
| `controls` | `minimal` / 省略 | 省略（リッチ版） |
| `layout` | `equal` / `main-sub` | `equal` |
| `subtitles` | `on` / `off` | `off` |

### postMessage API

```javascript
// embed → 親ウィンドウ（自動送信）
window.addEventListener('message', (e) => {
  if (e.data.source !== 'thestandard') return;
  // e.data.type: 'thestandard:ready'       — videoId付き
  // e.data.type: 'thestandard:timeupdate'  — currentTime, duration
});

// 親ウィンドウ → embed（シンプル版で使用）
iframe.contentWindow.postMessage({
  source: 'thestandard-host',
  command: 'seek',         // シーク
  value: 120               // 秒数
}, '*');

iframe.contentWindow.postMessage({
  source: 'thestandard-host',
  command: 'setLayout',    // レイアウト変更
  value: 'main-sub'        // 'single' | 'equal' | 'main-sub'
}, '*');

iframe.contentWindow.postMessage({
  source: 'thestandard-host',
  command: 'setSubtitles', // 字幕切替
  value: true              // boolean
}, '*');
```

### actola-pro 組み込み

当面はリッチ版をそのまま使う（actola-pro側の実装変更不要）:

```tsx
function TheStandardEmbed({ videoId }: { videoId: string }) {
  return (
    <iframe
      src={`https://thestandard.pages.dev/embed/${videoId}`}
      className="w-full aspect-video rounded-lg"
      allow="fullscreen"
      frameBorder="0"
    />
  );
}
```

将来的にチャプター連動フィードバック等が必要になったら、シンプル版 + postMessage API に切り替え:

```tsx
function TheStandardEmbed({ videoId, onTimeUpdate }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data.source !== 'thestandard') return;
      if (e.data.type === 'thestandard:timeupdate') {
        onTimeUpdate?.(e.data.currentTime, e.data.duration);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onTimeUpdate]);

  const seekTo = (seconds: number) => {
    iframeRef.current?.contentWindow?.postMessage(
      { source: 'thestandard-host', command: 'seek', value: seconds }, '*'
    );
  };

  return (
    <iframe
      ref={iframeRef}
      src={`https://thestandard.pages.dev/embed/${videoId}?controls=minimal`}
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

サイドバー付きマルチページ管理画面。Bearer token認証。

- **ダッシュボード** — 動画数 / 総時間 / カテゴリ数 / 公開中のKPIカード + 最近の更新
- **動画一覧** — サムネイル付きテーブル、検索、カテゴリ/ステータスフィルター
- **動画編集** — 基本情報 / アングル管理 / チャプター / Embed URL
- **動画新規作成** — ID/タイトル/カテゴリ/アングルの入力フォーム
- **ステータス管理** — draft / published / archived の3状態切替
- **KVストレージ** — 個別キー `video:{id}` + `video:index` (旧形式から自動マイグレーション)

## Mac Ingest App

SSD/HDD接続を自動検出し、コピー → エンコード → Bunnyアップロード → API登録を全自動実行するmacOSメニューバー常駐アプリ。

```bash
cd apps/ingest
npx tauri dev      # 開発
npx tauri build    # リリースビルド (.app + .dmg)
```

**機能:**
- 全外付けボリューム自動検出 (SSD/HDD問わず) + `~/footage/` 未処理素材スキャン
- カメラモデル自動判定 (ffprobe + mdls フォールバック)
- Apple Log → Rec.709 色補正 (LUT自動探索 → curvesフォールバック)
- H.264 1080p 24fps エンコード (既存スクリプトと同一パラメータ)
- Bunny.net ストリーミングアップロード (大容量ファイル対応)
- THE STANDARD API へのメタデータ自動登録
- shooting-log.md 自動生成

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

## OSS & セルフホスト

THE STANDARD はオープンソース（AGPL-3.0）の動画ホスティングプラットフォームです。
セルフホストして、あなた自身の動画配信サービスを構築できます。

### ユースケース
- **ジム・パーソナルトレーニング** — トレーナーの指導をマルチアングルで会員に配信
- **武道・ダンス教室** — 型やルーティンの自主練習用動画
- **リハビリ・医療** — 動作記録と専門家間共有
- **社内研修** — 実技指導の全拠点配信

### セルフホスト手順

```bash
git clone https://github.com/awatatgr/thestandard
cd thestandard
cp .env.example .env
# .env を編集: Supabase URL, Bunny CDN hostname を設定
npm install
npm run dev
```

### 構成の柔軟性

| 設定 | 動作 |
|------|------|
| Stripe 未設定 | 決済OFF、全動画を公開またはログイン制 |
| `ACCESS_MODE=public` | 認証不要で全動画公開（デフォルト） |
| `ACCESS_MODE=auth_required` | ログイン必須、ログインすれば全動画アクセス |
| `ACCESS_MODE=invite` | 管理者招待ユーザーのみ |

詳しくは [/open-source](https://thestandard.coach/open-source) をご覧ください。

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
| `ADMIN_TOKEN` | 管理API認証トークン | Cloudflare Pages 環境変数 |

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

### Phase 2 (完了) — 管理ダッシュボード + Mac App + リッチEmbed
- [x] 管理画面マルチページ化 (サイドバー + ダッシュボード + 一覧/編集/作成)
- [x] KV構造改善 (`video:{id}` + 自動マイグレーション)
- [x] API認証 (Bearer token) + ステータス管理 (draft/published/archived)
- [x] リッチ版 embed (レイアウト/チャプター/字幕UIをiframe内に内包)
- [x] シンプル版 embed (`?controls=minimal`, postMessage制御)
- [x] Mac Ingest App (Tauri 2.0, SSD自動検出 → エンコード → アップロード → 登録)

### Phase 3 — React SDK
- [ ] npm パッケージ `@thestandard/react`
- [ ] `<TheStandardPlayer videoId="..." />`
- [ ] Headless hooks: `useTheStandardPlayer()`

### Phase 4 — プラットフォーム化
- [ ] APIキー発行・管理
- [ ] Web Component `<the-standard-player>`
- [ ] 課金 (動画本数 x 視聴回数)
- [ ] 分析ダッシュボード (Bunny Statistics API連携)

## テスト

```bash
# Web
npx tsc --noEmit                                    # 型チェック (frontend)
npx tsc --project functions/tsconfig.json --noEmit   # 型チェック (functions)
npm run build                                        # ビルド確認
npx wrangler pages functions build                   # Functions コンパイル確認

# Mac Ingest App
cd apps/ingest && npx tsc --noEmit                   # 型チェック (frontend)
cd apps/ingest/src-tauri && cargo check              # Rust コンパイル確認
cd apps/ingest && npx tauri build                    # フルビルド (.app + .dmg)
```

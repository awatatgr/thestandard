# THE STANDARD — UAT テスト手順書

## 概要

THE STANDARD の主要ユーザーフローを検証する。2 つのモードがある:

1. **手動 UAT** — 人間がブラウザで操作し、FirstLook SDK のクエストオーバーレイに従って判定
2. **自動 UAT** — Playwright が同じフローを自動実行し、JSON レポートを出力

**推奨フロー: 手動 → 問題点を特定 → 自動テストに追加**

## 前提条件

| 項目 | 要件 |
|------|------|
| Node.js | v18+ |
| ブラウザ | Chrome / Chromium |
| thestandard | `~/dev/thestandard` にクローン済み |
| FirstLook SDK | `~/dev/firstlook` でビルド済み（手動 UAT 時） |

## セットアップ（初回のみ）

```bash
cd ~/dev/thestandard
npm install
npx playwright install chromium

# FirstLook SDK を配置（手動 UAT 用）
cp ~/dev/firstlook/packages/sdk/dist/firstlook.umd.js public/
```

---

## 手動 UAT（人間が操作）

### 起動

```bash
cd ~/dev/thestandard
npm run uat:manual
```

### 手順

1. ブラウザで `http://localhost:5173` を開く
2. DevTools コンソール (F12 → Console) に以下を貼り付けて Enter:

```javascript
const s=document.createElement("script");s.src="/uat-inject.js";document.head.appendChild(s);
```

3. 右下にクエストオーバーレイが表示される
4. 各クエストの手順に従ってアプリを操作する
5. 各ステップで判定:
   - **OK** — 期待通り動作した（コメント任意）
   - **気になる** — 動作するが気になる点あり（コメント必須）
   - **NG** — 期待通り動作しなかった（コメント必須）
6. 全クエスト完了後、「Finish & Upload」をタップ
7. 画面上部に結果サマリーが表示される
8. 「JSON レポートをダウンロード」でファイル保存

### 管理画面テスト

管理画面のクエストは `/admin` ページで実行する:

1. ブラウザで `http://localhost:5173/admin` に移動
2. 同じコンソールコマンドを貼り付けて実行
3. 管理画面用のクエストセット（6問）が表示される

### 手動 UAT のフロー図

```
テスター                    FirstLook SDK
  │                              │
  ├── npm run uat:manual ────────┤
  ├── ブラウザでアプリを開く ────┤
  ├── コンソールで inject ───────┤
  │                              ├── クエスト表示
  │                              │
  ├── アプリを操作 ──────────────┤
  ├── OK / 気になる / NG ────────┤
  │                              ├── 次のクエスト
  │   ... 繰り返し ...           │
  │                              │
  ├── Finish & Upload ───────────┤
  │                              ├── JSON レポート生成
  └── ダウンロード ──────────────┘
```

---

## 自動 UAT（Playwright）

### 全 UAT テスト実行

```bash
npm run uat
```

### 個別フロー実行

```bash
# 動画閲覧フロー（7クエスト）
npm run uat:viewer

# 管理画面フロー（7クエスト）
npm run uat:admin
```

### ブラウザ表示付き実行（デバッグ用）

```bash
npm run uat:headed
```

### 既存 E2E テスト（106件）も含めた全テスト

```bash
npm run test:e2e
```

## UAT クエスト一覧

### 動画閲覧フロー（viewer-flow）

| # | クエスト | 検証内容 |
|---|---------|---------|
| Q1 | 動画一覧ページが正常に表示される | ヒーロー、フィルター、動画カード |
| Q2 | カテゴリフィルターで絞り込みできる | ドリル → すべて → インタビュー（空） |
| Q3 | 動画詳細ページに遷移し情報が表示される | タイトル、説明文、カテゴリ、収録日 |
| Q4 | マルチアングルレイアウトを切り替えられる | シングル/均等/メイン+サブ、アングルタブ |
| Q5 | 字幕のON/OFFが切り替えられる | トグル状態の確認 |
| Q6 | 戻るボタンで一覧に戻れる | ナビゲーション |
| Q7 | 存在しない動画で404表示される | エラーハンドリング |

### 管理画面フロー（admin-flow）

| # | クエスト | 検証内容 |
|---|---------|---------|
| Q1 | ダッシュボードのKPIが表示される | 動画数、総時間、公開中、最近の更新 |
| Q2 | 動画管理ページで一覧・検索が機能する | 一覧表示、検索、クリア |
| Q3 | フィルター（カテゴリ/ステータス）が機能する | カテゴリ・ステータスフィルター |
| Q4 | 新規動画の作成フローが完走する | フォーム入力 → 作成 → 成功通知 |
| Q5 | 動画の公開ステータスを変更できる | draft → published トグル |
| Q6 | 動画の編集ページに遷移できる | 一覧 → 編集ページ遷移 |
| Q7 | 動画を削除できる（確認ダイアログ付き） | 削除 → 確認 → 成功通知 |

## レポート出力

テスト実行後、`uat-reports/` ディレクトリに JSON ファイルが生成される。

```
uat-reports/
├── viewer-flow.json
└── admin-flow.json
```

### JSON レポート構造

```json
{
  "meta": {
    "projectId": "thestandard",
    "userId": "playwright-cli",
    "startedAt": "2026-03-18T22:51:12.955Z",
    "endedAt": "2026-03-18T22:51:15.280Z",
    "durationSeconds": 2
  },
  "summary": {
    "total": 7,
    "passed": 7,
    "failed": 0,
    "concernCount": 0,
    "passRate": 100
  },
  "quests": [
    {
      "questId": "q1",
      "title": "動画一覧ページが正常に表示される",
      "status": "COMPLETED",
      "concern": false,
      "comment": null,
      "durationMs": 428
    }
  ],
  "generatedAt": "2026-03-18T..."
}
```

### CLI でレポート確認

```bash
# サマリー表示
cat uat-reports/viewer-flow.json | jq '.summary'

# 失敗クエストのみ抽出
cat uat-reports/admin-flow.json | jq '.quests[] | select(.status == "FAILED")'

# 全レポートのパス率一覧
for f in uat-reports/*.json; do
  echo "$(basename $f): $(cat $f | jq -r '.summary.passRate')%"
done
```

## テスト環境の仕組み

| モード | 認証 | API/CDN | データ |
|--------|------|---------|--------|
| 手動 UAT | デモモード（Supabase 未設定） | 実サーバー or ローカル | 静的データ (videos.ts) |
| 自動 UAT | デモモード | Playwright モック | fixtures.ts のモックデータ |

## ファイル構成

```
public/
├── firstlook.umd.js             # FirstLook SDK（手動 UAT 用）
└── uat-inject.js                # SDK 注入スクリプト（手動 UAT 用）
e2e/
├── fixtures.ts                  # 共通フィクスチャ（CDN/APIモック）
├── uat/
│   ├── reporter.ts              # JSON レポート生成（自動 UAT 用）
│   ├── viewer-flow.spec.ts      # 動画閲覧 UAT（7クエスト）
│   └── admin-flow.spec.ts       # 管理画面 UAT（7クエスト）
├── video-list.spec.ts           # 既存テスト（16件）
├── video-detail.spec.ts         # 既存テスト（15件）
├── ...                          # 既存テスト計106件
uat-reports/                     # 自動 UAT 出力先（.gitignore済み）
```

## トラブルシューティング

### ポート 8080 が使用中

```bash
lsof -i :8080 | grep LISTEN
kill -9 <PID>
```

### Chromium が未インストール

```bash
npx playwright install chromium
```

### テストがタイムアウトする

```bash
# タイムアウトを延長して実行
npx playwright test e2e/uat/ --timeout 60000
```

### 手動 UAT で SDK が読み込めない

```bash
# FirstLook SDK を再ビルド & コピー
cd ~/dev/firstlook
pnpm --filter @firstlook-uat/sdk build
cp packages/sdk/dist/firstlook.umd.js ~/dev/thestandard/public/
```

### npm scripts 一覧

| コマンド | 内容 |
|---------|------|
| `npm run uat:manual` | 手動 UAT 用サーバー起動 + 手順表示 |
| `npm run uat` | 全自動 UAT 実行（14クエスト） |
| `npm run uat:viewer` | 閲覧フロー自動 UAT（7クエスト） |
| `npm run uat:admin` | 管理画面自動 UAT（7クエスト） |
| `npm run uat:headed` | 自動 UAT をブラウザ表示付きで実行 |
| `npm run test:e2e` | 既存テスト + UAT 全実行（120件） |

# THE STANDARD — UAT テスト手順書

## 概要

THE STANDARD の主要ユーザーフローを検証する UAT（User Acceptance Testing）。
[FirstLook SDK](https://firstlook-dashboard.pages.dev/docs) のクエスト定義に準拠。

| モード | 説明 | コマンド |
|--------|------|---------|
| 手動 UAT | テスターが FirstLook オーバーレイに従って操作・判定 | `npm run uat:manual` |
| 自動 UAT | Playwright が同じフローを自動実行 | `npm run uat` |

## セットアップ（初回のみ）

```bash
cd ~/dev/thestandard
npm install
npx playwright install chromium

# FirstLook SDK を配置（手動 UAT 用）
cp ~/dev/firstlook/packages/sdk/dist/firstlook.umd.js public/
```

---

## ユースケース一覧

### 動画閲覧フロー（10 クエスト）

| ID | クエスト | blocking | 検証内容 |
|----|---------|----------|---------|
| VIEW-001 | 動画一覧ページが表示される | **Yes** | ヒーロー、フィルター、カード、ヘッダー |
| VIEW-002 | カテゴリフィルターで絞り込みできる | No | ドリル→すべて→インタビュー（空） |
| VIEW-003 | 動画詳細ページに遷移し情報が表示される | **Yes** | タイトル、説明文、カテゴリ、収録日 |
| VIEW-004 | マルチアングルレイアウトを切り替えられる | No | シングル/均等/メイン+サブ、アングルタブ |
| VIEW-005 | チャプターナビゲーションが機能する | No | チャプタータブ、一覧、クリックジャンプ |
| VIEW-006 | 字幕のON/OFFが切り替えられる | No | トグル状態の確認 |
| VIEW-007 | キーボードショートカットが動作する | No | Space/K, J/L, F, M, コマ送り |
| VIEW-008 | 再生速度を変更できる | No | 0.25x〜2x 速度メニュー |
| VIEW-009 | ナビゲーション（戻る・404）が正しく動作する | No | 戻るボタン、404表示、一覧復帰 |
| VIEW-010 | モバイル表示が崩れない | No | 390×844、タッチターゲット、レスポンシブ |

### 管理画面フロー（8 クエスト）

| ID | クエスト | blocking | 検証内容 |
|----|---------|----------|---------|
| ADMIN-001 | ダッシュボードのKPIが正しく表示される | **Yes** | 動画数、総時間、公開中、最近の更新、Ingest接続ボタン |
| ADMIN-002 | 動画管理ページで一覧が表示され検索できる | **Yes** | 一覧表示、件数、検索、クリア |
| ADMIN-003 | カテゴリ・ステータスフィルターが機能する | No | カテゴリ・ステータスフィルター |
| ADMIN-004 | 新規動画を作成できる | No | フォーム入力→作成→成功トースト |
| ADMIN-005 | 動画の公開ステータスを変更できる | No | draft→published トグル |
| ADMIN-006 | 動画の編集ページに遷移できる | No | 一覧→編集ページ遷移 |
| ADMIN-007 | 動画を削除できる（確認ダイアログ付き） | No | 削除→確認→成功トースト |
| ADMIN-008 | Embed共有URLが機能する | No | /embed/:id 認証不要表示 |

---

## 手動 UAT（人間が操作）

### 起動

```bash
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
   - **OK** — 期待通り動作した
   - **気になる** — 動作するが気になる点あり（コメント入力）
   - **NG** — 期待通り動作しなかった（コメント入力）
6. **blocking クエスト**が NG の場合、後続クエストは BLOCKED になる
7. 全クエスト完了後、「Finish & Upload」をタップ
8. 「JSON レポートをダウンロード」でファイル保存

### 管理画面テスト

1. ブラウザで `http://localhost:5173/admin` に移動
2. 同じコンソールコマンドを実行 → 管理画面用クエスト（8問）が表示される

---

## 自動 UAT（Playwright）

```bash
# 全 UAT（18 クエスト）
npm run uat

# 閲覧フローのみ（10 クエスト）
npm run uat:viewer

# 管理画面のみ（8 クエスト）
npm run uat:admin

# ブラウザ表示付き
npm run uat:headed
```

---

## クエスト定義フォーマット（FirstLook SDK 準拠）

```typescript
interface Quest {
  id: string;          // 一意ID (例: "VIEW-001", "ADMIN-003")
  title: string;       // テスター向けの短いタイトル
  description: string; // 手順（改行区切りの番号付きリスト）
  order: number;       // 実行順序（1〜）
  blocking?: boolean;  // true: 失敗時に後続クエストを BLOCKED にする
}
```

### blocking の使い分け

| blocking | 使いどころ |
|----------|-----------|
| `true` | 後続テストの前提条件（例: 一覧表示、ログイン） |
| `false` | 独立した機能テスト（例: 字幕、速度変更） |

---

## レポート出力

### JSON レポート構造

```json
{
  "meta": {
    "projectId": "thestandard",
    "userId": "playwright-cli",
    "startedAt": "2026-03-19T...",
    "endedAt": "2026-03-19T...",
    "durationSeconds": 5
  },
  "summary": {
    "total": 10,
    "passed": 9,
    "failed": 1,
    "blocked": 0,
    "concernCount": 2,
    "passRate": 90
  },
  "quests": [
    {
      "questId": "VIEW-001",
      "title": "動画一覧ページが表示される",
      "status": "COMPLETED",
      "concern": false,
      "comment": null,
      "durationMs": 428
    }
  ]
}
```

### CLI でレポート確認

```bash
# サマリー
cat uat-reports/viewer-flow.json | jq '.summary'

# 失敗クエストのみ
cat uat-reports/admin-flow.json | jq '.quests[] | select(.status == "FAILED")'

# 全レポートのパス率
for f in uat-reports/*.json; do
  echo "$(basename $f): $(cat $f | jq -r '.summary.passRate')%"
done
```

---

## ファイル構成

```
public/
├── firstlook.umd.js             # FirstLook SDK（手動 UAT 用）
└── uat-inject.js                # SDK 注入 + クエスト定義 + レポート生成
e2e/uat/
├── reporter.ts                  # JSON レポート生成（自動 UAT 用）
├── viewer-flow.spec.ts          # 動画閲覧 UAT（10 クエスト）
└── admin-flow.spec.ts           # 管理画面 UAT（8 クエスト）
UAT_PROCEDURE.md                 # この手順書
uat-reports/                     # 自動 UAT 出力先（.gitignore済み）
```

## npm scripts

| コマンド | 内容 |
|---------|------|
| `npm run uat:manual` | 手動 UAT 用サーバー起動 + 手順表示 |
| `npm run uat` | 全自動 UAT（18 クエスト） |
| `npm run uat:viewer` | 閲覧フロー自動 UAT（10 クエスト） |
| `npm run uat:admin` | 管理画面自動 UAT（8 クエスト） |
| `npm run uat:headed` | 自動 UAT をブラウザ表示付きで実行 |

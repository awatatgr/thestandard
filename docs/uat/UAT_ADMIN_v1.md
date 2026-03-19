# UAT Test Definition: Admin Role v1.0

- **Product**: THE STANDARD (https://thestandard.coach/)
- **Role**: Admin (管理者)
- **Version**: 1.0
- **Date**: 2026-03-19
- **Standard**: ISTQB UAT / IEEE 829

---

## Step 1: User Stories & Acceptance Criteria

### US-01: ダッシュボードで状況を把握する (P0)
> As an admin, I want to see KPI metrics on the dashboard, so that I can monitor content health.

**Acceptance Criteria:**
1. 動画数・総時間・カテゴリ数・公開数が KPI カードに表示される
2. 最近の更新セクションに直近の動画が並ぶ

### US-02: 動画を管理する (P0)
> As an admin, I want to create, edit, and delete videos, so that I can manage content.

**Acceptance Criteria:**
1. 動画一覧で全動画が検索・フィルター可能
2. 新規作成フォームで動画を追加できる
3. 編集フォームで既存動画を更新できる
4. 削除は確認ダイアログ付き

### US-03: 公開状態を制御する (P0)
> As an admin, I want to toggle video visibility, so that I can control what viewers see.

**Acceptance Criteria:**
1. 公開/非公開を 1 クリックで切替できる
2. 非公開動画は視聴者側に表示されない

### US-04: Embed URL を共有する (P1)
> As an admin, I want to copy embed URLs, so that I can share videos on external sites.

**Acceptance Criteria:**
1. 一覧からワンクリックで Embed URL をコピーできる
2. 編集画面に iframe スニペットが表示される

---

## Step 2: UAT Test Definitions

### Quest 1: 認証・認可ガード

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| ADMIN-001 | admin で管理画面アクセス | admin ロールでログイン済み | 1. `/admin` にアクセスする | ダッシュボードが表示される | User: `admin@example.com` (admin) | Yes |
| ADMIN-002 | 未認証で管理画面ブロック | 未ログイン | 1. `/admin` にアクセスする | `/login` にリダイレクトされる | - | Yes |
| ADMIN-003 | viewer で管理画面ブロック | viewer ロールでログイン済み | 1. `/admin` にアクセスする | `/` にリダイレクトされる | User: `viewer@example.com` (viewer) | No |
| ADMIN-004 | viewer で /admin/videos ブロック | viewer ロールでログイン済み | 1. `/admin/videos` にアクセスする | `/` にリダイレクトされる | - | No |
| ADMIN-005 | サイドバー「サイトに戻る」 | ADMIN-001 完了 | 1. サイドバー「サイトに戻る」をクリックする | `/` に遷移する | - | No |

### Quest 2: ダッシュボード KPI

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| ADMIN-006 | 動画数 KPI 表示 | `/admin` 表示中 | 1. 「動画数」カードを確認する | 正しい動画件数が表示される | - | No |
| ADMIN-007 | 総時間 KPI 表示 | `/admin` 表示中 | 1. 「総時間」カードを確認する | 合計再生時間が「Xh Ym」形式で表示される | - | No |
| ADMIN-008 | カテゴリ KPI 表示 | `/admin` 表示中 | 1. 「カテゴリ」カードを確認する | 使用中カテゴリ数が表示される | - | No |
| ADMIN-009 | 公開中 KPI 表示 | `/admin` 表示中 | 1. 「公開中」カードを確認する | published 状態の動画数が表示される | - | No |
| ADMIN-010 | 最近の更新セクション | `/admin` 表示中 | 1. 「最近の更新」セクションを確認する | 直近の動画がタイトル・日付・カテゴリバッジ付きで並ぶ | - | No |
| ADMIN-011 | 最近の更新クリックで編集 | ADMIN-010 完了 | 1. 動画行をクリックする | `/admin/videos/:id` (編集ページ) に遷移する | - | No |
| ADMIN-012 | 「新規動画」ボタン | `/admin` 表示中 | 1. 「新規動画」ボタンをクリックする | `/admin/videos/new` に遷移する | - | No |

### Quest 3: 動画一覧管理

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| ADMIN-013 | 動画一覧表示 | `/admin/videos` 表示中 | 1. 一覧を確認する | 全動画が件数バッジ付きで表示される。各行にサムネイル・タイトル・カテゴリ・ステータスバッジ | - | Yes |
| ADMIN-014 | 検索 — タイトル一致 | ADMIN-013 完了 | 1. 検索欄に「ストレッチ」を入力する | タイトルに「ストレッチ」を含む動画のみ表示される | Query: `ストレッチ` | No |
| ADMIN-015 | 検索 — クリアで全件復帰 | ADMIN-014 完了 | 1. 検索欄をクリアする | 全件に戻る | - | No |
| ADMIN-016 | カテゴリフィルター | ADMIN-013 完了 | 1. カテゴリ「ドリル」を選択する | drill 動画のみ表示される | - | No |
| ADMIN-017 | ステータスフィルター | ADMIN-013 完了 | 1. ステータス「下書き」を選択する | draft 動画のみ表示される | - | No |
| ADMIN-018 | 複合フィルター | ADMIN-013 完了 | 1. 検索+カテゴリ+ステータスを同時設定する | 全条件に一致する動画のみ表示される | - | No |
| ADMIN-019 | 結果 0 件 | ADMIN-013 完了 | 1. 存在しないキーワードで検索する | 結果が空でもエラーにならない | Query: `zzzzz` | No |
| ADMIN-020 | API 接続不可時のフォールバック | API が無効な状態 | 1. `/admin/videos` にアクセスする | 黄色バナー「APIに接続できません。静的データを表示中です。」が表示される | - | No |

### Quest 4: 動画作成

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| ADMIN-021 | 作成フォーム初期状態 | `/admin/videos/new` 表示中 | 1. フォームを確認する | ID・タイトル・カテゴリ(training)・アングル 1 つが初期表示される | - | Yes |
| ADMIN-022 | 全フィールド入力→作成成功 | ADMIN-021 完了 | 1. ID: `test-video`、タイトル: `テスト動画`、カテゴリ: `drill` を入力する<br>2. 「作成」ボタンをクリックする | 成功トーストが表示され、一覧に遷移する | ID: `test-video` | Yes |
| ADMIN-023 | 必須未入力でバリデーション | ADMIN-021 完了 | 1. タイトルを空のまま「作成」をクリックする | バリデーションエラーが表示される | - | No |
| ADMIN-024 | アングル追加 | ADMIN-021 完了 | 1. 「追加」ボタンをクリックする | 2 つ目のアングルフォームが表示される | - | No |
| ADMIN-025 | アングル削除 | ADMIN-024 完了 | 1. 2 つ目のアングルの × ボタンをクリックする | アングルが削除され 1 つに戻る | - | No |
| ADMIN-026 | チャプター追加 | ADMIN-021 完了 | 1. チャプター「追加」ボタンをクリックする | チャプター入力行が表示される（名前・開始・終了） | - | No |
| ADMIN-027 | 「キャンセル」で一覧に戻る | ADMIN-021 完了 | 1. 「キャンセル」ボタンをクリックする | `/admin/videos` に遷移する。作成されない | - | No |

### Quest 5: 動画編集

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| ADMIN-028 | 編集フォームにデータプリフィル | `/admin/videos/stretch-full` 表示中 | 1. フォームを確認する | 既存データ（タイトル・カテゴリ・アングル等）がプリフィルされている | URL: `/admin/videos/stretch-full` | Yes |
| ADMIN-029 | ID フィールドが編集不可 | ADMIN-028 完了 | 1. ID フィールドを確認する | disabled 属性で編集不可 | - | No |
| ADMIN-030 | タイトル変更→更新成功 | ADMIN-028 完了 | 1. タイトルを変更する<br>2. 「更新」ボタンをクリックする | 成功トーストが表示され、一覧に遷移する | - | No |
| ADMIN-031 | ステータスをドロップダウンで変更 | ADMIN-028 完了 | 1. ステータスを「published」に変更する<br>2. 「更新」をクリックする | ステータスが更新される | - | No |
| ADMIN-032 | 存在しない ID の編集ページ | admin ロールでログイン済み | 1. `/admin/videos/nonexistent-id` にアクセスする | エラーが表示される | URL: `/admin/videos/nonexistent-id` | No |
| ADMIN-033 | Embed セクション表示 | ADMIN-028 完了 | 1. Embed セクションを確認する | Embed URL と iframe スニペットが表示される | - | No |
| ADMIN-034 | Embed URL コピー | ADMIN-033 完了 | 1. Embed URL のコピーボタンをクリックする | クリップボードにコピーされ、フィードバック表示 | - | No |

### Quest 6: 公開・非公開切替

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| ADMIN-035 | draft → published | `/admin/videos` 表示中、draft 動画あり | 1. draft 動画の Eye アイコンをクリックする | 「公開しました」トースト。バッジが emerald「公開」に変化する | - | Yes |
| ADMIN-036 | published → draft | `/admin/videos` 表示中、published 動画あり | 1. published 動画の EyeOff アイコンをクリックする | 「非公開にしました」トースト。バッジが gray「下書き」に変化する | - | No |
| ADMIN-037 | 公開後、視聴者側に表示 | ADMIN-035 完了 | 1. ログアウトして `/` を確認する | 公開した動画が一覧に表示される | - | No |
| ADMIN-038 | 非公開後、視聴者側に非表示 | ADMIN-036 完了 | 1. ログアウトして `/` を確認する | 非公開にした動画が一覧に表示されない | - | No |

### Quest 7: 削除

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| ADMIN-039 | 確認ダイアログ表示 | `/admin/videos` 表示中 | 1. 動画のゴミ箱アイコンをクリックする | 確認ダイアログが表示される | - | No |
| ADMIN-040 | 削除確認→削除実行 | ADMIN-039 完了 | 1. 「OK」をクリックする | 「動画を削除しました」トースト。一覧から消える | - | No |
| ADMIN-041 | 削除キャンセル | ADMIN-039 完了 | 1. 「キャンセル」をクリックする | 動画が一覧に残る | - | No |

### Quest 8: Embed 共有

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| ADMIN-042 | 一覧から Embed URL コピー | `/admin/videos` 表示中 | 1. コピーアイコンをクリックする | 「Embed URLをコピーしました」トースト。クリップボードに URL が入る | - | No |
| ADMIN-043 | Embed ページ動作確認 | ADMIN-042 完了 | 1. コピーした URL をブラウザで開く | 認証なしでプレーヤーが表示される | URL: `/embed/stretch-full` | No |
| ADMIN-044 | ?controls=minimal | - | 1. `/embed/stretch-full?controls=minimal` を開く | UI コントロールなしで動画のみ表示される | URL: `/embed/stretch-full?controls=minimal` | No |
| ADMIN-045 | ?layout=equal | - | 1. `/embed/stretch-full?layout=equal` を開く | 均等レイアウトで表示される | URL: `/embed/stretch-full?layout=equal` | No |
| ADMIN-046 | 存在しない Embed ID | - | 1. `/embed/nonexistent-id` を開く | 「動画が見つかりません」が表示される | URL: `/embed/nonexistent-id` | No |

### Quest 9: Ingest App 接続

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| ADMIN-047 | Ingest App セクション表示 | `/admin` 表示中 | 1. ページ下部を確認する | 「Mac Ingest App」と「手動で追加」カードが表示される | - | No |
| ADMIN-048 | 接続設定コピー | ADMIN-047 完了 | 1. 「Ingest App 接続設定をコピー」をクリックする | ボタンテキストが「コピーしました」に変化。JSON がクリップボードにコピーされる | - | No |
| ADMIN-049 | 手動追加リンク | ADMIN-047 完了 | 1. 「新規動画を追加」をクリックする | `/admin/videos/new` に遷移する | - | No |

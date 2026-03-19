# UAT Test Definition: Authentication v1.0

- **Product**: THE STANDARD (https://thestandard.coach/)
- **Role**: Cross-role (Guest / Viewer / Admin)
- **Version**: 1.0
- **Date**: 2026-03-19
- **Standard**: ISTQB UAT / IEEE 829

---

## Step 1: User Stories & Acceptance Criteria

### US-01: マジックリンクでログインする (P0)
> As a guest, I want to log in with just my email address, so that I don't need to remember a password.

**Acceptance Criteria:**
1. `/login` でメールアドレスを入力→送信するとマジックリンクメールが送信される
2. メール内リンクをクリックすると `/` にログイン状態で遷移する
3. 無効なメール形式は HTML5 バリデーションでブロックされる

### US-02: 未認証ユーザーをブロックする (P0)
> As a product owner, I want to block unauthenticated users from content, so that content value is protected.

**Acceptance Criteria:**
1. 未認証で `/` → `/login` にリダイレクト
2. `/embed/:id` は認証不要
3. `/login`, `/signup`, `/open-source` は認証不要

### US-03: ログアウトする (P0)
> As a viewer, I want to log out, so that I can secure my account on shared devices.

**Acceptance Criteria:**
1. ユーザーメニュー→「ログアウト」でセッション破棄
2. ログアウト後、保護ページから `/login` にリダイレクト

### US-04: ロールベースアクセス制御 (P0)
> As a product owner, I want admin pages restricted to admins only, so that viewers can't modify content.

**Acceptance Criteria:**
1. admin ロールはヘッダーに「管理画面」リンクが表示される
2. viewer ロールで `/admin` → `/` にリダイレクト

---

## Step 2: UAT Test Definitions

### Quest 1: ログインフォーム

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| AUTH-001 | ログインフォーム表示 | 未ログイン | 1. `/login` にアクセスする | タイトル・メール入力欄 (placeholder: `you@example.com`)・「ログインリンクを送信」ボタン・パスワード不要テキストが表示される | URL: `/login` | Yes |
| AUTH-002 | マジックリンク送信 | AUTH-001 完了 | 1. メール入力欄に `admin@example.com` を入力する<br>2. 「ログインリンクを送信」をクリックする | ボタンが「送信中...」に変わり disabled になる。送信後「メールを確認してください」画面に遷移する | Email: `admin@example.com` | Yes |
| AUTH-003 | 送信完了画面の表示 | AUTH-002 完了 | 1. 確認画面を確認する | メールアイコン・「admin@example.com にログインリンクを送信しました」メッセージ・「別のメールアドレスを使う」リンクが表示される | - | No |
| AUTH-004 | 「別のメールアドレスを使う」 | AUTH-003 完了 | 1. リンクをクリックする | メール入力フォームに戻り、空の入力欄が表示される | - | No |
| AUTH-005 | 空メールでの送信ブロック | AUTH-001 完了 | 1. メール欄を空のまま送信ボタンをクリックする | HTML5 バリデーションによりフォーム送信がブロックされる | Email: (空) | No |
| AUTH-006 | 不正メール形式のブロック | AUTH-001 完了 | 1. `invalid-email` を入力して送信する | HTML5 バリデーションでブロックされる | Email: `invalid-email` | No |

### Quest 2: 認証ガード

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| AUTH-007 | 未認証で / アクセス | 未ログイン | 1. `/` にアクセスする | `/login` にリダイレクトされる | - | Yes |
| AUTH-008 | 未認証で /videos/:id | 未ログイン | 1. `/videos/stretch-full` にアクセスする | `/login` にリダイレクトされる | URL: `/videos/stretch-full` | No |
| AUTH-009 | /embed/:id は認証不要 | 未ログイン | 1. `/embed/stretch-full` にアクセスする | プレーヤーが表示される | URL: `/embed/stretch-full` | No |
| AUTH-010 | /login は認証不要 | 未ログイン | 1. `/login` にアクセスする | ログインフォームが表示される | - | No |
| AUTH-011 | /open-source は認証不要 | 未ログイン | 1. `/open-source` にアクセスする | OSS 紹介ページが表示される | - | No |
| AUTH-012 | ログイン済みで /login | ログイン済み | 1. `/login` にアクセスする | `/` にリダイレクトされる | - | No |

### Quest 3: ログアウト

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| AUTH-013 | ユーザーメニュー表示 | ログイン済み | 1. ヘッダー右のアバターをクリックする | メニューが表示され、メールアドレスと「ログアウト」ボタンが見える | - | No |
| AUTH-014 | ログアウト実行 | AUTH-013 完了 | 1. 「ログアウト」をクリックする | セッション破棄。ヘッダーにアバターが消え「ログイン」ボタンが表示される。`/login` にリダイレクト | - | No |

### Quest 4: ロールベースアクセス

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| AUTH-015 | admin メニュー | admin ロールでログイン済み | 1. アバターをクリックする | 「Admin」バッジ (amber) と「管理画面」リンクが表示される | User: admin role | No |
| AUTH-016 | viewer メニュー（管理画面リンクなし） | viewer ロールでログイン済み | 1. アバターをクリックする | メールと「ログアウト」のみ表示。「管理画面」リンクと「Admin」バッジは表示されない | User: viewer role | No |
| AUTH-017 | admin が /admin アクセス | admin ロールでログイン済み | 1. `/admin` にアクセスする | ダッシュボードが表示される | - | No |
| AUTH-018 | viewer が /admin ブロック | viewer ロールでログイン済み | 1. `/admin` にアクセスする | `/` にリダイレクトされる | - | No |

### Quest 5: セッション管理

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| AUTH-019 | ページ遷移でセッション維持 | ログイン済み、`/` 表示中 | 1. 動画カードをクリックして遷移する<br>2. ブラウザの戻るボタンで戻る | 両ページでログイン状態が維持される | - | No |
| AUTH-020 | リロードでセッション復元 | ログイン済み、`/` 表示中 | 1. ブラウザをリロードする | 再ログイン不要でログイン状態が維持される | - | No |
| AUTH-021 | 複数タブでセッション共有 | ログイン済み | 1. 新しいタブで `/` を開く | 新タブでもログイン状態 | - | No |

### Quest 6: ヘッダー UI

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| AUTH-022 | 未ログイン時ヘッダー | 未ログイン、`/login` 表示中 | 1. ヘッダーを確認する | 「THE STANDARD」ロゴと「ログイン」ボタンが表示される | - | No |
| AUTH-023 | ログイン時ヘッダー (viewer) | viewer ロールでログイン済み | 1. ヘッダーを確認する | アバター + メールプレフィックスが表示される。「ログイン」ボタンは非表示 | - | No |
| AUTH-024 | モバイルでメールプレフィックス非表示 | ログイン済み、モバイル(375px) | 1. ヘッダーを確認する | アバターのみ表示。メールプレフィックスは非表示 | - | No |
| AUTH-025 | メニュー外クリックで閉じる | AUTH-013 完了（メニュー表示中） | 1. メニュー外の領域をクリックする | メニューが閉じる | - | No |

### Quest 7: デモモード（Supabase 未設定）

| # | Test Item | Precondition | Steps | Expected Result | Test Data | Blocking |
|---|-----------|-------------|-------|-----------------|-----------|----------|
| AUTH-026 | Supabase 未設定で全ページアクセス | `VITE_SUPABASE_URL` 未設定 | 1. `/` にアクセスする | 認証なしで動画一覧が表示される（デモモード） | Env: no VITE_SUPABASE_URL | No |
| AUTH-027 | デモモードでコンソール警告 | AUTH-026 と同条件 | 1. ブラウザコンソールを確認する | 「Supabase not configured — running in demo mode」が出力される | - | No |

---

## Test Accounts

| Email | Role | Purpose |
|-------|------|---------|
| `admin@example.com` | admin | 管理者テスト全般 |
| `viewer@example.com` | viewer | 閲覧者テスト・RBAC |

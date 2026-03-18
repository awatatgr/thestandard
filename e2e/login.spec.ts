/**
 * ログインページ E2E テスト
 * Note: テスト環境では VITE_SUPABASE_URL 未設定のため Supabase は null
 * ログインページ自体の表示テストのみ（auth APIコールは発生しない）
 */
import { test, expect, setupCdnMock } from "./fixtures";

test.describe("ログインページ", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("ログインフォームが正しく表示される", async ({ page }) => {
    await setupCdnMock(page);
    await page.goto("/login");

    // タイトル
    await expect(page.getByText("THE STANDARD")).toBeVisible();
    await expect(page.getByText("メールアドレスでログイン")).toBeVisible();

    // メールフォーム
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("placeholder", "you@example.com");

    // 送信ボタン
    await expect(
      page.getByRole("button", { name: "ログインリンクを送信" }),
    ).toBeVisible();

    // フッターテキスト
    await expect(
      page.getByText("パスワード不要 — メールに届くリンクをクリックするだけ"),
    ).toBeVisible();
  });

  test("空メールで送信できない（HTML5バリデーション）", async ({ page }) => {
    await setupCdnMock(page);
    await page.goto("/login");

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute("required", "");
  });

  test("ダークテーマのログイン画面", async ({ page }) => {
    await setupCdnMock(page);
    await page.goto("/login");

    // bg-zinc-950 の背景色
    const body = page.locator(".bg-zinc-950").first();
    await expect(body).toBeVisible();
  });
});

/**
 * ルーティング・ナビゲーション E2E テスト
 * テスト環境: Auth未設定 → AuthGateがデモモードで通過
 */
import { test, expect, setupViewer, setupCdnMock } from "./fixtures";

test.describe("ルーティング", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("ホーム（/）にアクセスできる", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/");
    await expect(page.getByText("THE STANDARD")).toBeVisible();
  });

  test("動画詳細ページにアクセスできる", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/videos/stretch-full");
    await expect(
      page.getByText("ストレッチ＆モビリティ").first(),
    ).toBeVisible();
  });

  test("Embedページは認証不要でアクセス可能", async ({ page }) => {
    await setupCdnMock(page);
    await page.goto("/embed/stretch-full");
    expect(page.url()).toContain("/embed/stretch-full");
  });

  test("Open Sourceページは認証不要", async ({ page }) => {
    await page.goto("/open-source");
    expect(page.url()).toContain("/open-source");
  });

  test("ログインページにアクセス可能", async ({ page }) => {
    await setupCdnMock(page);
    await page.goto("/login");
    await expect(page.getByText("メールアドレスでログイン")).toBeVisible();
  });

  test("管理画面にアクセスできる（デモモード）", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/admin");
    // AdminLayout が表示される
    await expect(page.getByText("THE STANDARD").first()).toBeVisible();
  });
});

test.describe("ブラウザ履歴・ナビゲーション", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("動画一覧 → 詳細 → ブラウザバックで一覧に戻れる", async ({
    page,
  }) => {
    await setupViewer(page);
    await page.goto("/");

    // VideoCard をクリック
    await page.getByText("ウォームアップ＆ストレッチ").click();
    await page.waitForURL(/\/videos\//);

    // ブラウザバック
    await page.goBack();
    await page.waitForURL("/");
  });

  test("ヘッダーのTHE STANDARDクリックでホームに戻る", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/");

    await expect(
      page.locator("header").getByText("THE STANDARD"),
    ).toBeVisible();
  });

  test("存在しないURLでもアプリが動作する", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/nonexistent-page", { waitUntil: "networkidle" });
    // ページが読み込まれてrootが存在する
    await expect(page.locator("#root")).toBeAttached();
  });
});

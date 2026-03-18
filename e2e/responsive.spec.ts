/**
 * レスポンシブ E2E テスト（モバイル）
 * - 動画一覧のレイアウト
 * - 動画詳細: サイドバー非表示、チャプターアコーディオン
 */
import { test, expect, setupViewer, setupCdnMock } from "./fixtures";

test.describe("レスポンシブ — モバイル", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  // ─── 動画一覧ページ ─────────────────────────────────

  test("モバイルでヒーローセクションが表示される", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/");
    await expect(
      page.getByText("ストレッチ＆モビリティ").first(),
    ).toBeVisible();
    await expect(page.getByText("再生する")).toBeVisible();
  });

  test("モバイルでカテゴリフィルターが表示される", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "すべて" })).toBeVisible();
  });

  // ─── 動画詳細ページ ─────────────────────────────────

  test("モバイルでサイドバーが非表示", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/videos/stretch-full");
    // lg: でのみ表示されるサイドバー — モバイルでは width: 0
    // サイドバーのコンテンツ（動画一覧ヘッダー）が見えないことを確認
    const sidebarContent = page.locator(".lg\\:w-80");
    // モバイルでは表示されないか、幅0
    if (await sidebarContent.count() > 0) {
      const box = await sidebarContent.first().boundingBox();
      // 幅が0または非表示
      expect(!box || box.width === 0).toBeTruthy();
    }
  });

  test("モバイルでチャプターアコーディオンが表示される", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/videos/stretch-3view");

    // lg:hidden のアコーディオン
    const accordion = page.locator(".lg\\:hidden").filter({ hasText: "チャプター" });
    await expect(accordion).toBeVisible();
  });

  test("モバイルで戻るボタンが動作する", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/videos/stretch-full");
    await page.locator("button").first().click();
    await page.waitForURL("/");
  });

  // ─── Embedページ ─────────────────────────────────────

  test("モバイルでEmbed表示が崩れない", async ({ page }) => {
    await setupCdnMock(page);
    await page.goto("/embed/stretch-full");
    await expect(page.getByTitle("シングルビュー")).toBeVisible();
  });

  // ─── ログインページ ─────────────────────────────────

  test("モバイルでログインフォームが画面内に収まる", async ({ page }) => {
    await setupCdnMock(page);
    await page.goto("/login");

    const button = page.getByRole("button", { name: "ログインリンクを送信" });
    await expect(button).toBeVisible();

    const box = await button.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  });
});

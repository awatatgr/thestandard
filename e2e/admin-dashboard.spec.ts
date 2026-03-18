/**
 * 管理ダッシュボード E2E テスト
 */
import { test, expect, setupAdmin } from "./fixtures";

test.describe("管理ダッシュボード @desktop", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin");
  });

  test("ダッシュボードタイトルが表示される", async ({ page }) => {
    await expect(page.getByText("ダッシュボード").first()).toBeVisible();
  });

  test("動画数KPIカードが表示される", async ({ page }) => {
    await expect(page.getByText("動画数")).toBeVisible();
    await expect(page.getByText("7").first()).toBeVisible();
  });

  test("総時間KPIカードが表示される", async ({ page }) => {
    await expect(page.getByText("総時間")).toBeVisible();
    await expect(page.getByText("44分")).toBeVisible();
  });

  test("カテゴリKPIカードが表示される", async ({ page }) => {
    await expect(page.getByText("カテゴリ").first()).toBeVisible();
  });

  test("公開中KPIカードが表示される", async ({ page }) => {
    await expect(page.getByText("公開中")).toBeVisible();
  });

  test("「新規動画」ボタンで作成ページに遷移", async ({ page }) => {
    await page.locator("button").filter({ hasText: "新規動画" }).first().click();
    await page.waitForURL("/admin/videos/new");
  });

  test("最近の更新セクションが表示される", async ({ page }) => {
    await expect(page.getByText("最近の更新")).toBeVisible();
  });

  test("最近の更新に動画タイトルが表示される", async ({ page }) => {
    await expect(page.getByText("ストレッチ＆モビリティ").first()).toBeVisible();
  });

  test("最近の更新クリックで編集ページに遷移", async ({ page }) => {
    await page.locator("button").filter({ hasText: "ストレッチ＆モビリティ" }).first().click();
    await page.waitForURL("/admin/videos/stretch-full");
  });

  test("動画追加セクションが表示される", async ({ page }) => {
    await expect(page.getByText("動画を追加する")).toBeVisible();
  });

  test("Mac Ingest Appカードが表示される", async ({ page }) => {
    await expect(page.getByText("Mac Ingest App")).toBeVisible();
  });

  test("手動追加の「新規動画を追加」で遷移", async ({ page }) => {
    await page.locator("button").filter({ hasText: "新規動画を追加" }).click();
    await page.waitForURL("/admin/videos/new");
  });

  test("サイドバーに動画管理リンクがある", async ({ page }) => {
    await expect(page.getByText("動画管理")).toBeVisible();
  });

  test("動画管理リンクで遷移", async ({ page }) => {
    await page.getByText("動画管理").click();
    await page.waitForURL("/admin/videos");
  });
});

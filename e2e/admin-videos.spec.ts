/**
 * 管理 — 動画管理ページ E2E テスト
 */
import { test, expect, setupAdmin, MOCK_API_VIDEOS } from "./fixtures";

test.describe("管理 — 動画管理 @desktop", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");
  });

  // ─── 基本表示 ─────────────────────────────────────

  test("動画管理タイトルが表示される", async ({ page }) => {
    await expect(page.getByText("動画管理").first()).toBeVisible();
  });

  test("動画リストが表示される", async ({ page }) => {
    await expect(page.getByText("ストレッチ＆モビリティ").first()).toBeVisible();
    await expect(page.getByText("トレッドミルでランニングフォーム分析")).toBeVisible();
  });

  test("動画件数が表示される", async ({ page }) => {
    await expect(page.getByText(`${MOCK_API_VIDEOS.length}件`)).toBeVisible();
  });

  test("カテゴリバッジが表示される", async ({ page }) => {
    const row = page.locator("[class*='rounded-xl']").first();
    await expect(row.getByText("トレーニング")).toBeVisible();
  });

  test("ステータスバッジが表示される", async ({ page }) => {
    const row = page.locator("[class*='rounded-xl']").first();
    await expect(row.getByText("公開")).toBeVisible();
  });

  test("新規動画ボタンで作成ページに遷移", async ({ page }) => {
    await page.locator("button").filter({ hasText: "新規動画" }).click();
    await page.waitForURL("/admin/videos/new");
  });

  // ─── 検索 ─────────────────────────────────────────

  test("検索ボックスが表示される", async ({ page }) => {
    await expect(page.getByPlaceholder("検索...")).toBeVisible();
  });

  test("検索で動画を絞り込める", async ({ page }) => {
    await page.getByPlaceholder("検索...").fill("ストレッチ");
    await expect(page.getByText("ストレッチ＆モビリティ").first()).toBeVisible();
    await expect(page.getByText("トレッドミルでランニングフォーム分析")).not.toBeVisible();
  });

  test("検索クリアで全件表示", async ({ page }) => {
    await page.getByPlaceholder("検索...").fill("ストレッチ");
    await page.getByPlaceholder("検索...").clear();
    await expect(page.getByText("トレッドミルでランニングフォーム分析")).toBeVisible();
  });

  // ─── フィルター ─────────────────────────────────────

  test("カテゴリフィルターで絞り込める", async ({ page }) => {
    await page.locator("select").nth(0).selectOption("drill");
    await expect(page.getByText("バーベルスクワット＆ランジ")).toBeVisible();
  });

  test("ステータスフィルターで絞り込める", async ({ page }) => {
    await page.locator("select").nth(1).selectOption("draft");
    await expect(page.getByText("バーベルスクワット＆ランジ")).toBeVisible();
  });

  // ─── アクション ─────────────────────────────────────

  test("公開トグルでトースト表示", async ({ page }) => {
    // draft動画の公開ボタン
    const row = page.locator("[class*='rounded-xl']").filter({ hasText: "バーベルスクワット" });
    await row.getByTitle("公開する").click();
    await expect(page.getByText("公開しました")).toBeVisible();
  });

  test("編集ボタンで編集ページに遷移", async ({ page }) => {
    const row = page.locator("[class*='rounded-xl']").filter({ hasText: "ストレッチ＆モビリティ" });
    await row.getByTitle("編集").click();
    await page.waitForURL("/admin/videos/stretch-full");
  });

  test("Embed URLコピーボタンがある", async ({ page }) => {
    const row = page.locator("[class*='rounded-xl']").filter({ hasText: "ストレッチ＆モビリティ" });
    await expect(row.getByTitle("Embed URLをコピー")).toBeVisible();
  });

  test("削除で確認ダイアログが表示される", async ({ page }) => {
    page.on("dialog", (dialog) => {
      expect(dialog.type()).toBe("confirm");
      dialog.dismiss();
    });
    const row = page.locator("[class*='rounded-xl']").filter({ hasText: "ストレッチ＆モビリティ" });
    await row.getByTitle("削除").click();
  });

  test("削除確認で成功トースト", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    const row = page.locator("[class*='rounded-xl']").filter({ hasText: "ストレッチ＆モビリティ" });
    await row.getByTitle("削除").click();
    await expect(page.getByText("動画を削除しました")).toBeVisible();
  });
});

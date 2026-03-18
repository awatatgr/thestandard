/**
 * 動画一覧ページ E2E テスト
 */
import { test, expect, setupViewer } from "./fixtures";

test.describe("動画一覧ページ @desktop", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await setupViewer(page);
    await page.goto("/");
  });

  // ─── ヒーローセクション ─────────────────────────

  test("ヒーローに最初の動画タイトルが表示される", async ({ page }) => {
    await expect(
      page.locator("h2").filter({ hasText: "ストレッチ＆モビリティ" }),
    ).toBeVisible();
  });

  test("ヒーローに「再生する」ボタンがある", async ({ page }) => {
    await expect(page.getByText("再生する")).toBeVisible();
  });

  test("ヒーローにカテゴリバッジ「トレーニング」が表示される", async ({
    page,
  }) => {
    const heroSection = page.locator("section").first();
    await expect(heroSection.getByText("トレーニング")).toBeVisible();
  });

  test("ヒーローに所要時間とアングル数が表示される", async ({ page }) => {
    const heroSection = page.locator("section").first();
    await expect(heroSection.getByText("10:12")).toBeVisible();
    await expect(heroSection.getByText("2 アングル")).toBeVisible();
  });

  test("ヒーロークリックで詳細ページに遷移", async ({ page }) => {
    await page.locator("section").first().click();
    await page.waitForURL("/videos/stretch-full");
  });

  // ─── ヘッダー ─────────────────────────────────────

  test("ヘッダーにTHE STANDARDロゴがある", async ({ page }) => {
    await expect(page.locator("header").getByText("THE STANDARD")).toBeVisible();
  });

  test("ヘッダーにログインボタンが表示される（デモモード）", async ({ page }) => {
    await expect(page.locator("header").getByText("ログイン")).toBeVisible();
  });

  // ─── カテゴリフィルター ───────────────────────────

  test("カテゴリフィルターボタンがすべて表示される", async ({ page }) => {
    const filterBar = page.locator("main .flex.gap-2").first();
    await expect(filterBar.getByRole("button", { name: "すべて" })).toBeVisible();
    await expect(filterBar.getByRole("button", { name: "トレーニング" })).toBeVisible();
    await expect(filterBar.getByRole("button", { name: "ドリル" })).toBeVisible();
    await expect(filterBar.getByRole("button", { name: "メソッド" })).toBeVisible();
    await expect(filterBar.getByRole("button", { name: "インタビュー" })).toBeVisible();
  });

  test("「すべて」がデフォルトでアクティブ", async ({ page }) => {
    const allButton = page.locator("main button").filter({ hasText: "すべて" });
    await expect(allButton).toHaveClass(/bg-primary/);
  });

  test("「ドリル」フィルターで絞り込める", async ({ page }) => {
    await page.locator("main button").filter({ hasText: "ドリル" }).click();
    // ドリル動画が表示される
    await expect(page.getByText("バーベルスクワット＆ランジ")).toBeVisible();
  });

  test("「メソッド」フィルターで絞り込める", async ({ page }) => {
    await page.locator("main button").filter({ hasText: "メソッド" }).click();
    await expect(page.getByText("3動画_ストレッチ")).toBeVisible();
    await expect(page.getByText("トレーナー運動指導セッション")).toBeVisible();
  });

  test("「すべて」に戻すとフィルターリセット", async ({ page }) => {
    await page.locator("main button").filter({ hasText: "ドリル" }).click();
    await page.locator("main button").filter({ hasText: "すべて" }).click();
    // 全カード表示される
    await expect(page.getByText("ウォームアップ＆ストレッチ")).toBeVisible();
    await expect(page.getByText("バーベルスクワット＆ランジ")).toBeVisible();
  });

  test("該当なしカテゴリで空状態表示", async ({ page }) => {
    await page.locator("main button").filter({ hasText: "インタビュー" }).click();
    await expect(page.getByText("動画がありません")).toBeVisible();
  });

  // ─── 動画カード ─────────────────────────────────────

  test("動画カードにタイトルが表示される", async ({ page }) => {
    await expect(page.getByText("トレッドミルでランニングフォーム分析")).toBeVisible();
    await expect(page.getByText("ウォームアップ＆ストレッチ")).toBeVisible();
  });

  test("動画カードに所要時間が表示される", async ({ page }) => {
    await expect(page.getByText("1:39")).toBeVisible();
    await expect(page.getByText("3:17")).toBeVisible();
  });

  test("動画カードクリックで詳細ページに遷移", async ({ page }) => {
    await page.getByText("ウォームアップ＆ストレッチ").click();
    await page.waitForURL("/videos/warmup-stretch");
  });

  test("動画カードに収録日が表示される", async ({ page }) => {
    await expect(page.getByText("2026-03-16").first()).toBeVisible();
  });
});

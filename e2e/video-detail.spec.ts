/**
 * 動画詳細ページ E2E テスト
 */
import { test, expect, setupViewer } from "./fixtures";

test.describe("動画詳細ページ @desktop", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await setupViewer(page);
  });

  // ─── タイトルバー ─────────────────────────────────

  test("タイトルバーに動画タイトルが表示される", async ({ page }) => {
    await page.goto("/videos/stretch-full");
    await expect(page.locator("h1").filter({ hasText: "ストレッチ＆モビリティ" })).toBeVisible();
  });

  test("戻るボタンで一覧ページに遷移", async ({ page }) => {
    await page.goto("/videos/stretch-full");
    // 最初のボタン（ArrowLeftアイコン）
    await page.locator("button svg").first().click();
    await page.waitForURL("/");
  });

  // ─── レイアウト切り替え ───────────────────────────

  test("レイアウト切り替えボタンが表示される", async ({ page }) => {
    await page.goto("/videos/stretch-full");
    await expect(page.getByTitle("シングルビュー")).toBeVisible();
    await expect(page.getByTitle("均等並び")).toBeVisible();
    await expect(page.getByTitle("メイン+サブ")).toBeVisible();
  });

  test("シングルビューでアングルタブが表示される", async ({ page }) => {
    await page.goto("/videos/stretch-full");
    await page.getByTitle("シングルビュー").click();
    await expect(page.getByText("アングル:")).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "正面" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "側面" }).first()).toBeVisible();
  });

  // ─── 字幕トグル ─────────────────────────────────────

  test("字幕ボタンが表示される", async ({ page }) => {
    await page.goto("/videos/stretch-full");
    await expect(page.getByTitle(/字幕/)).toBeVisible();
  });

  test("字幕トグルが動作する", async ({ page }) => {
    await page.goto("/videos/stretch-full");
    const subBtn = page.getByTitle(/字幕/).first();
    await expect(subBtn).toHaveClass(/bg-primary/);
    await subBtn.click();
    await expect(subBtn).not.toHaveClass(/bg-primary/);
    await subBtn.click();
    await expect(subBtn).toHaveClass(/bg-primary/);
  });

  // ─── サイドバー ─────────────────────────────────────

  test("サイドバーに動画一覧が表示される", async ({ page }) => {
    await page.goto("/videos/running-form");
    await expect(page.getByText("動画一覧")).toBeVisible();
  });

  // ─── チャプター ─────────────────────────────────────

  test("チャプタータブが表示される（エクササイズ付き動画）", async ({ page }) => {
    await page.goto("/videos/stretch-3view");
    // チャプタータブボタン
    await expect(page.locator("button").filter({ hasText: /^チャプター$/ }).first()).toBeVisible();
  });

  test("チャプターリストにエクササイズが表示される", async ({ page }) => {
    await page.goto("/videos/stretch-3view");
    await expect(page.getByText("長座体前屈（ウォームアップ）").first()).toBeVisible();
  });

  // ─── 動画情報 ─────────────────────────────────────

  test("動画情報にカテゴリバッジが表示される", async ({ page }) => {
    await page.goto("/videos/squat-lunge");
    await expect(page.getByText("ドリル").first()).toBeVisible();
  });

  test("動画情報にチャプター名が表示される", async ({ page }) => {
    await page.goto("/videos/squat-lunge");
    await expect(page.getByText("ウェイトトレーニング").first()).toBeVisible();
  });

  test("動画情報に収録日が表示される", async ({ page }) => {
    await page.goto("/videos/stretch-full");
    await expect(page.getByText("2026-03-16").first()).toBeVisible();
  });

  test("動画説明文が表示される", async ({ page }) => {
    await page.goto("/videos/stretch-full");
    await expect(page.getByText(/マット上でのストレッチ/)).toBeVisible();
  });

  // ─── 404 ─────────────────────────────────────────

  test("存在しないIDで「動画が見つかりません」表示", async ({ page }) => {
    await page.goto("/videos/nonexistent-video-id");
    await expect(page.getByText("動画が見つかりません")).toBeVisible();
  });

  test("「一覧に戻る」クリックでホームに遷移", async ({ page }) => {
    await page.goto("/videos/nonexistent-video-id");
    await page.getByText("一覧に戻る").click();
    await page.waitForURL("/");
  });
});

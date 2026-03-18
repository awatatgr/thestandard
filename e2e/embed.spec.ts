/**
 * Embed ページ E2E テスト
 */
import { test, expect, setupCdnMock } from "./fixtures";

test.describe("Embedページ — リッチモード @desktop", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await setupCdnMock(page);
  });

  test("マルチアングル動画でレイアウトボタンが表示される", async ({ page }) => {
    await page.goto("/embed/stretch-full");
    await expect(page.getByTitle("シングルビュー")).toBeVisible();
    await expect(page.getByTitle("均等並び")).toBeVisible();
    await expect(page.getByTitle("メイン+サブ")).toBeVisible();
  });

  test("シングルビューでアングルタブが表示される", async ({ page }) => {
    await page.goto("/embed/stretch-full");
    await page.getByTitle("シングルビュー").click();
    await expect(page.locator("button").filter({ hasText: "正面" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "側面" }).first()).toBeVisible();
  });

  test("字幕トグルが表示される", async ({ page }) => {
    await page.goto("/embed/stretch-full");
    await expect(page.getByTitle(/字幕/)).toBeVisible();
  });

  test("字幕トグルが動作する", async ({ page }) => {
    await page.goto("/embed/stretch-full");
    const subBtn = page.getByTitle(/字幕/).first();
    await expect(subBtn).toHaveClass(/bg-primary/);
    await subBtn.click();
    await expect(subBtn).not.toHaveClass(/bg-primary/);
  });

  test("チャプターボタンが表示される（エクササイズ付き）", async ({ page }) => {
    await page.goto("/embed/stretch-3view");
    await expect(page.getByTitle("チャプター")).toBeVisible();
  });

  test("チャプターパネルが開閉する", async ({ page }) => {
    await page.goto("/embed/stretch-3view");
    await page.getByTitle("チャプター").click();
    // チャプターリストパネルが表示される
    await expect(page.getByText("長座体前屈（ウォームアップ）").first()).toBeVisible();
  });

  test("チャプタークリックでパネルが閉じる", async ({ page }) => {
    await page.goto("/embed/stretch-3view");
    await page.getByTitle("チャプター").click();
    await expect(page.getByText("長座体前屈（ウォームアップ）").first()).toBeVisible();
    // チャプター項目をクリック
    await page.locator("button").filter({ hasText: "長座体前屈（ウォームアップ）" }).first().click();
    // パネルが閉じる
    await expect(page.getByText("足首回し・モビリティ")).not.toBeVisible();
  });
});

test.describe("Embedページ — ミニマルモード", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("UIコントロールが非表示", async ({ page }) => {
    await setupCdnMock(page);
    await page.goto("/embed/stretch-full?controls=minimal");
    await expect(page.getByTitle("シングルビュー")).not.toBeVisible();
    await expect(page.getByTitle("均等並び")).not.toBeVisible();
  });
});

test.describe("Embedページ — エラー表示", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("存在しないIDで「動画が見つかりません」表示", async ({ page }) => {
    await setupCdnMock(page);
    await page.goto("/embed/nonexistent-id");
    await expect(page.getByText("動画が見つかりません")).toBeVisible();
  });
});

test.describe("Embedページ — URLパラメータ", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("layout=main-subでメイン+サブがデフォルト", async ({ page }) => {
    await setupCdnMock(page);
    await page.goto("/embed/stretch-full?layout=main-sub");
    const btn = page.getByTitle("メイン+サブ");
    await expect(btn).toHaveClass(/bg-zinc-700/);
  });

  test("subtitles=onで字幕がON", async ({ page }) => {
    await setupCdnMock(page);
    await page.goto("/embed/stretch-full?subtitles=on");
    const subBtn = page.getByTitle(/字幕/).first();
    await expect(subBtn).toHaveClass(/bg-primary/);
  });
});

/**
 * 管理 — 動画作成ページ E2E テスト
 */
import { test, expect, setupAdmin } from "./fixtures";

test.describe("管理 — 動画作成 @desktop", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos/new");
  });

  // ─── 基本表示 ─────────────────────────────────────

  test("タイトルが表示される", async ({ page }) => {
    await expect(page.getByText("新規動画を追加")).toBeVisible();
  });

  test("基本情報セクションが表示される", async ({ page }) => {
    await expect(page.getByText("基本情報")).toBeVisible();
  });

  test("ID入力フィールドが表示される", async ({ page }) => {
    await expect(page.getByPlaceholder("stretch-full")).toBeVisible();
  });

  test("タイトル入力フィールドが表示される", async ({ page }) => {
    await expect(page.getByPlaceholder("ストレッチ＆モビリティ")).toBeVisible();
  });

  test("カテゴリセレクトがデフォルトtraining", async ({ page }) => {
    const select = page.locator("select").first();
    await expect(select).toHaveValue("training");
  });

  test("説明テキストエリアが表示される", async ({ page }) => {
    await expect(page.getByPlaceholder("動画の説明...")).toBeVisible();
  });

  // ─── アングル ─────────────────────────────────────

  test("デフォルトで1アングルが表示される", async ({ page }) => {
    await expect(page.getByText("アングル (1)")).toBeVisible();
  });

  test("アングル追加で増える", async ({ page }) => {
    await page.locator("section").filter({ hasText: "アングル" }).getByText("追加").click();
    await expect(page.getByText("アングル (2)")).toBeVisible();
  });

  // ─── チャプター ─────────────────────────────────────

  test("チャプターセクションが表示される", async ({ page }) => {
    await expect(page.getByText("チャプター (0)")).toBeVisible();
  });

  test("チャプター追加で入力欄が表示される", async ({ page }) => {
    // チャプターセクション内の追加ボタン
    const chapterSection = page.locator("section").filter({ hasText: /^チャプター/ });
    await chapterSection.locator("button").filter({ hasText: "追加" }).click();
    await expect(page.getByText("チャプター (1)")).toBeVisible();
    await expect(page.getByPlaceholder("長座体前屈")).toBeVisible();
  });

  // ─── バリデーション ─────────────────────────────────

  test("未入力で作成するとエラー", async ({ page }) => {
    await page.locator("button").filter({ hasText: "作成" }).click();
    await expect(page.getByText("ID・タイトル・アングルは必須です")).toBeVisible();
  });

  // ─── 作成成功 ─────────────────────────────────────

  test("必須フィールド入力後に作成成功", async ({ page }) => {
    await page.getByPlaceholder("stretch-full").fill("e2e-test");
    await page.getByPlaceholder("ストレッチ＆モビリティ").fill("E2Eテスト動画");
    await page.getByPlaceholder("stretch-front").fill("e2e-front");

    await page.locator("button").filter({ hasText: "作成" }).click();
    await expect(page.getByText("動画を作成しました")).toBeVisible();
    await page.waitForURL("/admin/videos", { timeout: 3000 });
  });

  // ─── キャンセル ─────────────────────────────────────

  test("キャンセルで動画管理に遷移", async ({ page }) => {
    await page.locator("button").filter({ hasText: "キャンセル" }).click();
    await page.waitForURL("/admin/videos");
  });

  // ─── カテゴリ選択 ─────────────────────────────────

  test("全カテゴリが選択可能", async ({ page }) => {
    const select = page.locator("select").first();
    for (const value of ["training", "drill", "method", "interview"]) {
      await select.selectOption(value);
      await expect(select).toHaveValue(value);
    }
  });
});

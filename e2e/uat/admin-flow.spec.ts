/**
 * UAT — 管理画面フロー (8 クエスト)
 *
 * ADMIN-001〜ADMIN-008: ダッシュボード → 一覧検索 → フィルター → 作成 →
 * 公開変更 → 編集遷移 → 削除 → Embed確認
 */
import { test, expect, setupAdmin, setupViewer } from "../fixtures";
import { UATReporter } from "./reporter";

const reporter = new UATReporter({
  projectId: "thestandard",
  userId: "playwright-cli",
});

test.describe("UAT: 管理画面フロー", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ viewport: { width: 1280, height: 720 } });

  test.afterEach(async ({}, testInfo) => {
    const match = testInfo.title.match(/^(ADMIN-\d+): (.+)$/);
    if (!match) return;
    const [, id, title] = match;
    if (testInfo.status === "passed") {
      reporter.pass(id, title, testInfo.duration);
    } else {
      reporter.fail(id, title, testInfo.duration, testInfo.error?.message);
    }
  });

  test.afterAll(() => {
    reporter.save("admin-flow.json");
  });

  // ── blocking: true ──────────────────────────────────────────

  test("ADMIN-001: ダッシュボードのKPIが正しく表示される", async ({
    page,
  }) => {
    await setupAdmin(page);
    await page.goto("/admin");

    await expect(page.getByText("ダッシュボード").first()).toBeVisible();

    // KPI カード
    await expect(page.getByText("動画数")).toBeVisible();
    await expect(page.getByText("7").first()).toBeVisible();
    await expect(page.getByText("総時間")).toBeVisible();
    await expect(page.getByText("44分")).toBeVisible();
    await expect(page.getByText("公開中")).toBeVisible();

    // 最近の更新
    await expect(page.getByText("最近の更新")).toBeVisible();
    await expect(
      page.getByText("ストレッチ＆モビリティ").first(),
    ).toBeVisible();

    // Ingest App 接続ボタン
    await expect(
      page.getByText("Ingest App 接続設定をコピー"),
    ).toBeVisible();
  });

  // ── blocking: true ──────────────────────────────────────────

  test("ADMIN-002: 動画管理ページで一覧が表示され検索できる", async ({
    page,
  }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    // 一覧表示
    await expect(page.getByText("動画管理").first()).toBeVisible();
    await expect(
      page.getByText("ストレッチ＆モビリティ").first(),
    ).toBeVisible();
    await expect(
      page.getByText("トレッドミルでランニングフォーム分析"),
    ).toBeVisible();
    await expect(page.getByText("3件")).toBeVisible();

    // 検索
    await page.getByPlaceholder("検索...").fill("ストレッチ");
    await expect(
      page.getByText("ストレッチ＆モビリティ").first(),
    ).toBeVisible();
    await expect(
      page.getByText("トレッドミルでランニングフォーム分析"),
    ).not.toBeVisible();

    // クリア
    await page.getByPlaceholder("検索...").clear();
    await expect(
      page.getByText("トレッドミルでランニングフォーム分析"),
    ).toBeVisible();
  });

  test("ADMIN-003: カテゴリ・ステータスフィルターが機能する", async ({
    page,
  }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    // カテゴリフィルター
    await page.locator("select").nth(0).selectOption("drill");
    await expect(page.getByText("バーベルスクワット＆ランジ")).toBeVisible();

    // リセット
    await page.locator("select").nth(0).selectOption("");

    // ステータスフィルター
    await page.locator("select").nth(1).selectOption("draft");
    await expect(page.getByText("バーベルスクワット＆ランジ")).toBeVisible();
  });

  test("ADMIN-004: 新規動画を作成できる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos/new");

    // フォーム入力
    await page.getByPlaceholder("stretch-full").fill("uat-test-video");
    await page
      .getByPlaceholder("ストレッチ＆モビリティ")
      .fill("UAT テスト動画");
    await page.locator("select").first().selectOption("training");

    // アングル
    await page.getByPlaceholder("stretch-front").fill("uat-front");

    // 作成
    await page.locator("button").filter({ hasText: "作成" }).click();
    await expect(page.getByText("動画を作成しました")).toBeVisible();
  });

  test("ADMIN-005: 動画の公開ステータスを変更できる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    // draft 動画を公開
    const row = page
      .locator("[class*='rounded-xl']")
      .filter({ hasText: "バーベルスクワット" });
    await row.getByTitle("公開する").click();
    await expect(page.getByText("公開しました")).toBeVisible();
  });

  test("ADMIN-006: 動画の編集ページに遷移できる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    const row = page
      .locator("[class*='rounded-xl']")
      .filter({ hasText: "ストレッチ＆モビリティ" });
    await row.getByTitle("編集").click();
    await page.waitForURL("/admin/videos/stretch-full");
  });

  test("ADMIN-007: 動画を削除できる（確認ダイアログ付き）", async ({
    page,
  }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    page.on("dialog", (dialog) => dialog.accept());
    const row = page
      .locator("[class*='rounded-xl']")
      .filter({ hasText: "ストレッチ＆モビリティ" });
    await row.getByTitle("削除").click();
    await expect(page.getByText("動画を削除しました")).toBeVisible();
  });

  test("ADMIN-008: Embed共有URLが機能する", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/embed/stretch-full");

    // Embed ページが表示される（認証不要）
    await expect(page.locator("video").first()).toBeVisible();
  });
});

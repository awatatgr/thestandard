/**
 * UAT — 管理画面フロー
 *
 * 管理者がダッシュボード→動画管理→検索→作成→公開→削除を順に確認するフロー。
 * 結果は JSON レポートとして uat-reports/ に出力される。
 */
import { test, expect, setupAdmin } from "../fixtures";
import { UATReporter } from "./reporter";

const reporter = new UATReporter({
  projectId: "thestandard",
  userId: "playwright-cli",
});

test.describe("UAT: 管理画面フロー", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ viewport: { width: 1280, height: 720 } });

  test.afterEach(async ({}, testInfo) => {
    const match = testInfo.title.match(/^(Q\d+): (.+)$/);
    if (!match) return;
    const [, id, title] = match;
    if (testInfo.status === "passed") {
      reporter.pass(id.toLowerCase(), title, testInfo.duration);
    } else {
      reporter.fail(
        id.toLowerCase(),
        title,
        testInfo.duration,
        testInfo.error?.message,
      );
    }
  });

  test.afterAll(() => {
    reporter.save("admin-flow.json");
  });

  test("Q1: ダッシュボードのKPIが表示される", async ({ page }) => {
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
  });

  test("Q2: 動画管理ページで一覧・検索が機能する", async ({ page }) => {
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

  test("Q3: フィルター（カテゴリ/ステータス）が機能する", async ({
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

  test("Q4: 新規動画の作成フローが完走する", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos/new");

    // 基本情報入力
    await page.getByPlaceholder("stretch-full").fill("uat-test-video");
    await page
      .getByPlaceholder("ストレッチ＆モビリティ")
      .fill("UAT テスト動画");
    await page.locator("select").first().selectOption("training");

    // アングル入力
    await page.getByPlaceholder("stretch-front").fill("uat-front");

    // 作成
    await page.locator("button").filter({ hasText: "作成" }).click();
    await expect(page.getByText("動画を作成しました")).toBeVisible();
  });

  test("Q5: 動画の公開ステータスを変更できる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    // draft 動画を公開
    const row = page
      .locator("[class*='rounded-xl']")
      .filter({ hasText: "バーベルスクワット" });
    await row.getByTitle("公開する").click();
    await expect(page.getByText("公開しました")).toBeVisible();
  });

  test("Q6: 動画の編集ページに遷移できる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    const row = page
      .locator("[class*='rounded-xl']")
      .filter({ hasText: "ストレッチ＆モビリティ" });
    await row.getByTitle("編集").click();
    await page.waitForURL("/admin/videos/stretch-full");
  });

  test("Q7: 動画を削除できる（確認ダイアログ付き）", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    page.on("dialog", (dialog) => dialog.accept());
    const row = page
      .locator("[class*='rounded-xl']")
      .filter({ hasText: "ストレッチ＆モビリティ" });
    await row.getByTitle("削除").click();
    await expect(page.getByText("動画を削除しました")).toBeVisible();
  });
});

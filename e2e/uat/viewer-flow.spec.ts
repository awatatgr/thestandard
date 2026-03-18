/**
 * UAT — 動画閲覧フロー
 *
 * テスターが動画一覧→フィルター→詳細→レイアウト切替→字幕を順に確認するフロー。
 * 結果は JSON レポートとして uat-reports/ に出力される。
 */
import { test, expect, setupViewer } from "../fixtures";
import { UATReporter } from "./reporter";

const reporter = new UATReporter({
  projectId: "thestandard",
  userId: "playwright-cli",
});

test.describe("UAT: 動画閲覧フロー", () => {
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
    reporter.save("viewer-flow.json");
  });

  test("Q1: 動画一覧ページが正常に表示される", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/");

    // ヒーローセクション
    await expect(
      page.locator("h2").filter({ hasText: "ストレッチ＆モビリティ" }),
    ).toBeVisible();
    await expect(page.getByText("再生する")).toBeVisible();

    // ヘッダー
    await expect(
      page.locator("header").getByText("THE STANDARD"),
    ).toBeVisible();

    // カテゴリフィルター
    const filterBar = page.locator("main .flex.gap-2").first();
    await expect(
      filterBar.getByRole("button", { name: "すべて" }),
    ).toBeVisible();
    await expect(
      filterBar.getByRole("button", { name: "トレーニング" }),
    ).toBeVisible();

    // 動画カードが存在する
    await expect(
      page.getByText("トレッドミルでランニングフォーム分析"),
    ).toBeVisible();
  });

  test("Q2: カテゴリフィルターで絞り込みできる", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/");

    // 「ドリル」で絞り込み
    await page.locator("main button").filter({ hasText: "ドリル" }).click();
    await expect(page.getByText("バーベルスクワット＆ランジ")).toBeVisible();

    // 「すべて」に戻す
    await page.locator("main button").filter({ hasText: "すべて" }).click();
    await expect(page.getByText("ウォームアップ＆ストレッチ")).toBeVisible();
    await expect(page.getByText("バーベルスクワット＆ランジ")).toBeVisible();

    // 該当なしカテゴリ
    await page
      .locator("main button")
      .filter({ hasText: "インタビュー" })
      .click();
    await expect(page.getByText("動画がありません")).toBeVisible();
  });

  test("Q3: 動画詳細ページに遷移し情報が表示される", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/");

    // ヒーロークリックで遷移
    await page.locator("section").first().click();
    await page.waitForURL("/videos/stretch-full");

    // タイトル
    await expect(
      page.locator("h1").filter({ hasText: "ストレッチ＆モビリティ" }),
    ).toBeVisible();

    // 説明文
    await expect(page.getByText(/マット上でのストレッチ/)).toBeVisible();

    // カテゴリバッジ
    await expect(page.getByText("トレーニング").first()).toBeVisible();

    // 収録日
    await expect(page.getByText("2026-03-16").first()).toBeVisible();
  });

  test("Q4: マルチアングルレイアウトを切り替えられる", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/videos/stretch-full");

    // レイアウトボタン確認
    await expect(page.getByTitle("シングルビュー")).toBeVisible();
    await expect(page.getByTitle("均等並び")).toBeVisible();
    await expect(page.getByTitle("メイン+サブ")).toBeVisible();

    // シングルビューに切替
    await page.getByTitle("シングルビュー").click();
    await expect(page.getByText("アングル:")).toBeVisible();
    await expect(
      page.locator("button").filter({ hasText: "正面" }).first(),
    ).toBeVisible();
    await expect(
      page.locator("button").filter({ hasText: "側面" }).first(),
    ).toBeVisible();
  });

  test("Q5: 字幕のON/OFFが切り替えられる", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/videos/stretch-full");

    const subBtn = page.getByTitle(/字幕/).first();
    await expect(subBtn).toBeVisible();

    // デフォルト ON
    await expect(subBtn).toHaveClass(/bg-primary/);

    // OFF に切り替え
    await subBtn.click();
    await expect(subBtn).not.toHaveClass(/bg-primary/);

    // ON に戻す
    await subBtn.click();
    await expect(subBtn).toHaveClass(/bg-primary/);
  });

  test("Q6: 戻るボタンで一覧に戻れる", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/videos/stretch-full");

    await page.locator("button svg").first().click();
    await page.waitForURL("/");

    await expect(
      page.locator("h2").filter({ hasText: "ストレッチ＆モビリティ" }),
    ).toBeVisible();
  });

  test("Q7: 存在しない動画で404表示される", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/videos/nonexistent-video-id");

    await expect(page.getByText("動画が見つかりません")).toBeVisible();
    await page.getByText("一覧に戻る").click();
    await page.waitForURL("/");
  });
});

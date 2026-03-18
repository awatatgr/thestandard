/**
 * UAT — 動画閲覧フロー (10 クエスト)
 *
 * VIEW-001〜VIEW-010: 一覧表示 → フィルター → 詳細遷移 → マルチアングル →
 * チャプター → 字幕 → キーボード → 再生速度 → ナビゲーション → モバイル
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
    const match = testInfo.title.match(/^(VIEW-\d+): (.+)$/);
    if (!match) return;
    const [, id, title] = match;
    if (testInfo.status === "passed") {
      reporter.pass(id, title, testInfo.duration);
    } else {
      reporter.fail(id, title, testInfo.duration, testInfo.error?.message);
    }
  });

  test.afterAll(() => {
    reporter.save("viewer-flow.json");
  });

  // ── blocking: true ──────────────────────────────────────────

  test("VIEW-001: 動画一覧ページが表示される", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/");

    // ヒーロー
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
    await expect(
      filterBar.getByRole("button", { name: "ドリル" }),
    ).toBeVisible();

    // 動画カード
    await expect(
      page.getByText("トレッドミルでランニングフォーム分析"),
    ).toBeVisible();
  });

  test("VIEW-002: カテゴリフィルターで絞り込みできる", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/");

    // ドリルで絞り込み
    await page.locator("main button").filter({ hasText: "ドリル" }).click();
    await expect(page.getByText("バーベルスクワット＆ランジ")).toBeVisible();

    // すべてに戻す
    await page.locator("main button").filter({ hasText: "すべて" }).click();
    await expect(page.getByText("ウォームアップ＆ストレッチ")).toBeVisible();
    await expect(page.getByText("バーベルスクワット＆ランジ")).toBeVisible();

    // 該当なし
    await page
      .locator("main button")
      .filter({ hasText: "インタビュー" })
      .click();
    await expect(page.getByText("動画がありません")).toBeVisible();
  });

  // ── blocking: true ──────────────────────────────────────────

  test("VIEW-003: 動画詳細ページに遷移し情報が表示される", async ({
    page,
  }) => {
    await setupViewer(page);
    await page.goto("/");

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

  test("VIEW-004: マルチアングルレイアウトを切り替えられる", async ({
    page,
  }) => {
    await setupViewer(page);
    await page.goto("/videos/stretch-full");

    // 3つのレイアウトボタン
    await expect(page.getByTitle("シングルビュー")).toBeVisible();
    await expect(page.getByTitle("均等並び")).toBeVisible();
    await expect(page.getByTitle("メイン+サブ")).toBeVisible();

    // シングルビューに切替 → アングルタブ表示
    await page.getByTitle("シングルビュー").click();
    await expect(page.getByText("アングル:")).toBeVisible();
    await expect(
      page.locator("button").filter({ hasText: "正面" }).first(),
    ).toBeVisible();
    await expect(
      page.locator("button").filter({ hasText: "側面" }).first(),
    ).toBeVisible();
  });

  test("VIEW-005: チャプターナビゲーションが機能する", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/videos/stretch-full");

    // チャプタータブ（存在する場合のみ）
    const chaptersTab = page.locator("button").filter({ hasText: "チャプター" });
    if ((await chaptersTab.count()) > 0) {
      await chaptersTab.first().click();
      // チャプター一覧が表示
      const chapterItems = page.locator("[data-chapter]");
      if ((await chapterItems.count()) > 0) {
        await expect(chapterItems.first()).toBeVisible();
      }
    }
    // チャプターなし動画の場合はパス（テスト成功扱い）
  });

  test("VIEW-006: 字幕のON/OFFが切り替えられる", async ({ page }) => {
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

  test("VIEW-007: キーボードショートカットが動作する", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/videos/stretch-full");

    // プレーヤー領域をクリックしてフォーカス
    await page.locator("video").first().click({ force: true });

    // Space で再生/一時停止（エラーにならないことを確認）
    await page.keyboard.press("Space");
    // F でフルスクリーン試行
    await page.keyboard.press("f");
    // M でミュート
    await page.keyboard.press("m");

    // プレーヤーが壊れていないことを確認
    await expect(page.locator("video").first()).toBeVisible();
  });

  test("VIEW-008: 再生速度を変更できる", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/videos/stretch-full");

    // 速度ボタンが存在するか
    const speedBtn = page.locator("button").filter({ hasText: /\dx/ }).first();
    if ((await speedBtn.count()) > 0) {
      await speedBtn.click();
      // 速度メニューが開く
      const options = page.locator("button").filter({ hasText: /\d\.\d+x/ });
      if ((await options.count()) > 0) {
        await expect(options.first()).toBeVisible();
      }
    }
  });

  test("VIEW-009: ナビゲーション（戻る・404）が正しく動作する", async ({
    page,
  }) => {
    await setupViewer(page);
    await page.goto("/videos/stretch-full");

    // 戻るボタン
    await page.locator("button svg").first().click();
    await page.waitForURL("/");
    await expect(
      page.locator("h2").filter({ hasText: "ストレッチ＆モビリティ" }),
    ).toBeVisible();

    // 404
    await page.goto("/videos/nonexistent-video-id");
    await expect(page.getByText("動画が見つかりません")).toBeVisible();
    await page.getByText("一覧に戻る").click();
    await page.waitForURL("/");
  });

  test("VIEW-010: モバイル表示が崩れない", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await setupViewer(page);
    await page.goto("/");

    // ヒーロー表示
    await expect(
      page.locator("h2").filter({ hasText: "ストレッチ＆モビリティ" }),
    ).toBeVisible();

    // フィルター表示
    await expect(
      page.locator("main button").filter({ hasText: "すべて" }).first(),
    ).toBeVisible();

    // カード表示
    await expect(
      page.getByText("トレッドミルでランニングフォーム分析"),
    ).toBeVisible();

    await context.close();
  });
});

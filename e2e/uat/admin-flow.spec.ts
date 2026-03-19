/**
 * UAT — Admin Flow (Section 1-10)
 *
 * UAT_ADMIN_v1.md に準拠した自動テスト。
 * 各セクションの主要テストケース（正常系中心）を自動化。
 *
 * Section 1: Authentication & Authorization Guard
 * Section 2: Dashboard KPI
 * Section 3: Video List Management
 * Section 4: Search & Filter
 * Section 5: Create Video
 * Section 6: Edit Video
 * Section 7: Publish / Unpublish Toggle
 * Section 8: Delete
 * Section 9: Embed Share
 * Section 10: Ingest App Connection
 */
import { test, expect, setupAdmin, setupViewer, MOCK_API_VIDEOS } from "../fixtures";
import { UATReporter } from "./reporter";

const reporter = new UATReporter({
  projectId: "thestandard",
  userId: "playwright-cli",
});

test.describe("UAT: Admin Flow (Section 1-10)", () => {
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

  // ═══════════════════════════════════════════════════════════
  // Section 1: Authentication & Authorization Guard
  // ═══════════════════════════════════════════════════════════

  test("ADMIN-001: admin権限で管理画面にアクセスできる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin");

    // Dashboard title
    await expect(page.getByText("ダッシュボード").first()).toBeVisible();

    // Sidebar navigation
    await expect(page.getByText("動画管理").first()).toBeVisible();
    await expect(page.getByText("サイトに戻る")).toBeVisible();
  });

  test("ADMIN-004: サイドバーの「サイトに戻る」でトップページに遷移する", async ({
    page,
  }) => {
    await setupAdmin(page);
    await page.goto("/admin");

    await page.getByText("サイトに戻る").click();
    await page.waitForURL("/");
  });

  test("ADMIN-005: サイドバーの「動画管理」リンクが動作する", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin");

    await page.getByText("動画管理").click();
    await page.waitForURL("**/admin/videos");

    // Active state
    const activeLink = page.locator("a").filter({ hasText: "動画管理" });
    await expect(activeLink).toHaveClass(/bg-zinc-800/);
  });

  // ═══════════════════════════════════════════════════════════
  // Section 2: Dashboard KPI
  // ═══════════════════════════════════════════════════════════

  test("ADMIN-010: KPIカード「動画数」が正しく表示される", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin");

    await expect(page.getByText("動画数")).toBeVisible();
    await expect(page.getByText("7").first()).toBeVisible();
  });

  test("ADMIN-011: KPIカード「総時間」が分単位で表示される", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin");

    await expect(page.getByText("総時間")).toBeVisible();
    await expect(page.getByText("44分")).toBeVisible();
  });

  test("ADMIN-012: KPIカード「カテゴリ」が正しく表示される", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin");

    await expect(page.getByText("カテゴリ").first()).toBeVisible();
    await expect(page.getByText("3").first()).toBeVisible();
  });

  test("ADMIN-013: KPIカード「公開中」が正しく表示される", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin");

    await expect(page.getByText("公開中")).toBeVisible();
    await expect(page.getByText("5").first()).toBeVisible();
  });

  test("ADMIN-014: 「最近の更新」セクションが表示される", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin");

    await expect(page.getByText("最近の更新")).toBeVisible();
    // First mock video
    await expect(
      page.getByText("ストレッチ＆モビリティ").first(),
    ).toBeVisible();
  });

  test("ADMIN-015: 最近の更新から編集ページに遷移できる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin");

    // Click first recent video
    const recentSection = page.locator("section").filter({ hasText: "最近の更新" });
    await recentSection.locator("button").first().click();

    await page.waitForURL(/\/admin\/videos\/.+/);
  });

  test("ADMIN-016: ダッシュボードの「新規動画」ボタンで作成ページに遷移する", async ({
    page,
  }) => {
    await setupAdmin(page);
    await page.goto("/admin");

    await page.getByRole("button", { name: "新規動画", exact: true }).click();
    await page.waitForURL("**/admin/videos/new");
  });

  // ═══════════════════════════════════════════════════════════
  // Section 3: Video List Management
  // ═══════════════════════════════════════════════════════════

  test("ADMIN-020: 動画一覧に全動画が表示される", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    await expect(page.getByText("動画管理").first()).toBeVisible();

    // All mock videos visible
    await expect(
      page.getByText("ストレッチ＆モビリティ").first(),
    ).toBeVisible();
    await expect(
      page.getByText("トレッドミルでランニングフォーム分析"),
    ).toBeVisible();
    await expect(page.getByText("バーベルスクワット＆ランジ")).toBeVisible();

    // Count display
    await expect(page.getByText("3件")).toBeVisible();
  });

  test("ADMIN-021: 動画にカテゴリバッジ・ステータスバッジが表示される", async ({
    page,
  }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    // stretch-full: training + published
    const stretchRow = page
      .locator("[class*='rounded-xl']")
      .filter({ hasText: "ストレッチ＆モビリティ" });
    await expect(stretchRow.getByText("トレーニング")).toBeVisible();
    await expect(stretchRow.getByText("公開")).toBeVisible();
  });

  test("ADMIN-022: draft動画に「下書き」バッジが表示される", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    const sqRow = page
      .locator("[class*='rounded-xl']")
      .filter({ hasText: "バーベルスクワット" });
    await expect(sqRow.getByText("下書き")).toBeVisible();
  });

  test("ADMIN-023: 動画行にアングル数・再生時間・収録日が表示される", async ({
    page,
  }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    const stretchRow = page
      .locator("[class*='rounded-xl']")
      .filter({ hasText: "ストレッチ＆モビリティ" });
    await expect(stretchRow.getByText(/アングル/)).toBeVisible();
    await expect(stretchRow.getByText("10分")).toBeVisible();
    await expect(stretchRow.getByText("2026-03-16")).toBeVisible();
  });

  test("ADMIN-024: 動画一覧の「新規動画」ボタンから作成ページに遷移する", async ({
    page,
  }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    await page.locator("button").filter({ hasText: "新規動画" }).click();
    await page.waitForURL("**/admin/videos/new");
  });

  // ═══════════════════════════════════════════════════════════
  // Section 4: Search & Filter
  // ═══════════════════════════════════════════════════════════

  test("ADMIN-030: テキスト検索で動画が絞り込まれる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    await page.getByPlaceholder("検索...").fill("ストレッチ");
    await expect(
      page.getByText("ストレッチ＆モビリティ").first(),
    ).toBeVisible();
    // running-form should not contain "ストレッチ" in title
    await expect(
      page.getByText("トレッドミルでランニングフォーム分析"),
    ).not.toBeVisible();
  });

  test("ADMIN-032: 検索クリアで全件に戻る", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    await page.getByPlaceholder("検索...").fill("ストレッチ");
    await expect(
      page.getByText("トレッドミルでランニングフォーム分析"),
    ).not.toBeVisible();

    await page.getByPlaceholder("検索...").clear();
    await expect(
      page.getByText("トレッドミルでランニングフォーム分析"),
    ).toBeVisible();
  });

  test("ADMIN-033: カテゴリフィルターで絞り込みできる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    await page.locator("select").nth(0).selectOption("drill");
    await expect(page.getByText("バーベルスクワット＆ランジ")).toBeVisible();
  });

  test("ADMIN-034: ステータスフィルターで絞り込みできる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    await page.locator("select").nth(1).selectOption("draft");
    await expect(page.getByText("バーベルスクワット＆ランジ")).toBeVisible();
  });

  test("ADMIN-036: フィルター結果0件でもエラーにならない", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    await page.getByPlaceholder("検索...").fill("存在しないタイトル_xyz");
    await expect(page.getByText("0件")).toBeVisible();
    // Page should not crash
    await expect(page.getByText("動画管理").first()).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════
  // Section 5: Create Video
  // ═══════════════════════════════════════════════════════════

  test("ADMIN-040: 新規作成フォームが正しい初期状態で表示される", async ({
    page,
  }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos/new");

    // Title
    await expect(page.getByText("新規動画を追加")).toBeVisible();

    // Basic info section
    await expect(page.getByText("基本情報")).toBeVisible();

    // Angle section: 1 angle by default
    await expect(page.getByText("アングル (1)")).toBeVisible();

    // Chapter section: 0 by default
    await expect(page.getByText("チャプター (0)")).toBeVisible();
    await expect(
      page.getByText("チャプターを追加するとプレイヤーにオーバーレイ表示されます。"),
    ).toBeVisible();
  });

  test("ADMIN-042: 全フィールド入力で動画を作成できる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos/new");

    // Fill form
    await page.getByPlaceholder("stretch-full").fill("uat-test-video");
    await page.getByPlaceholder("ストレッチ＆モビリティ").fill("UATテスト動画");
    await page.locator("select").first().selectOption("training");
    await page.getByPlaceholder("stretch-front").fill("uat-front");

    // Submit
    await page.locator("button").filter({ hasText: "作成" }).click();
    await expect(page.getByText("動画を作成しました")).toBeVisible();
  });

  test("ADMIN-043: 必須フィールド未入力でバリデーションエラーが表示される", async ({
    page,
  }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos/new");

    // Try to submit empty form (clear default angle label too)
    const angleLabel = page.getByPlaceholder("正面");
    await angleLabel.clear();

    // Need to also clear the angle ID since it's required
    await page.locator("button").filter({ hasText: "作成" }).click();
    await expect(page.getByText("ID・タイトル・アングルは必須です")).toBeVisible();
  });

  test("ADMIN-045: アングルを追加できる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos/new");

    await expect(page.getByText("アングル (1)")).toBeVisible();

    // Click add angle button
    const angleSection = page.locator("section").filter({ hasText: "アングル" });
    await angleSection.getByText("追加").click();

    await expect(page.getByText("アングル (2)")).toBeVisible();
    await expect(page.getByText("アングル 2")).toBeVisible();
  });

  test("ADMIN-048: チャプターを追加できる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos/new");

    await expect(page.getByText("チャプター (0)")).toBeVisible();

    // Click add chapter button
    const chapterSection = page.locator("section").filter({ hasText: "チャプター" });
    await chapterSection.getByRole("button").first().click();

    await expect(page.getByText("チャプター (1)")).toBeVisible();
  });

  test("ADMIN-050: キャンセルボタンで一覧に戻る", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos/new");

    await page.locator("button").filter({ hasText: "キャンセル" }).click();
    await page.waitForURL("**/admin/videos");
  });

  // ═══════════════════════════════════════════════════════════
  // Section 6: Edit Video
  // ═══════════════════════════════════════════════════════════

  test("ADMIN-060: 編集ページに既存データがプリフィルされる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    // Click edit icon on stretch-full
    const row = page
      .locator("[class*='rounded-xl']")
      .filter({ hasText: "ストレッチ＆モビリティ" });
    await row.getByTitle("編集").click();
    await page.waitForURL("**/admin/videos/stretch-full");

    // Title is prefilled
    await expect(page.getByText("動画を編集")).toBeVisible();
    await expect(page.getByText("stretch-full").first()).toBeVisible();

    // Form fields populated
    const titleInput = page.getByPlaceholder("ストレッチ＆モビリティ");
    await expect(titleInput).toHaveValue("ストレッチ＆モビリティ — フルセッション");
  });

  test("ADMIN-061: IDフィールドが編集不可になっている", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos/stretch-full");

    // Wait for form to load
    await expect(page.getByText("動画を編集")).toBeVisible();

    // ID field is disabled
    const idInput = page.getByPlaceholder("stretch-full");
    await expect(idInput).toBeDisabled();
  });

  test("ADMIN-062: タイトルを変更して保存できる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos/stretch-full");

    await expect(page.getByText("動画を編集")).toBeVisible();

    // Change title
    const titleInput = page.getByPlaceholder("ストレッチ＆モビリティ");
    await titleInput.clear();
    await titleInput.fill("ストレッチ＆モビリティ — 更新テスト");

    // Save
    await page.locator("button").filter({ hasText: "更新" }).click();
    await expect(page.getByText("動画を更新しました")).toBeVisible();
  });

  test("ADMIN-066: タイトル空で保存するとエラーになる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos/stretch-full");

    await expect(page.getByText("動画を編集")).toBeVisible();

    // Clear title
    const titleInput = page.getByPlaceholder("ストレッチ＆モビリティ");
    await titleInput.clear();

    // Save
    await page.locator("button").filter({ hasText: "更新" }).click();
    await expect(page.getByText("タイトル・アングルは必須です")).toBeVisible();
  });

  test("ADMIN-067: キャンセルボタンで一覧に戻る", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos/stretch-full");

    await expect(page.getByText("動画を編集")).toBeVisible();

    await page.locator("button").filter({ hasText: "キャンセル" }).click();
    await page.waitForURL("**/admin/videos");
  });

  test("ADMIN-068: サイドバーから動画管理に遷移できる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos/stretch-full");

    await expect(page.getByText("動画を編集")).toBeVisible();

    // Navigate via sidebar
    await page.getByText("動画管理").click();
    await page.waitForURL("**/admin/videos");
    await expect(page.getByText("動画管理").first()).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════
  // Section 7: Publish / Unpublish Toggle
  // ═══════════════════════════════════════════════════════════

  test("ADMIN-070: draft動画を公開に切り替えられる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    const row = page
      .locator("[class*='rounded-xl']")
      .filter({ hasText: "バーベルスクワット" });
    await row.getByTitle("公開する").click();
    await expect(page.getByText("公開しました")).toBeVisible();
  });

  test("ADMIN-071: published動画を非公開に切り替えられる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    const row = page
      .locator("[class*='rounded-xl']")
      .filter({ hasText: "ストレッチ＆モビリティ" });
    await row.getByTitle("非公開にする").click();
    await expect(page.getByText("非公開にしました")).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════
  // Section 8: Delete
  // ═══════════════════════════════════════════════════════════

  test("ADMIN-080: 削除確認ダイアログが表示される", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    // Listen for dialog
    let dialogMessage = "";
    page.on("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss(); // Cancel
    });

    const row = page
      .locator("[class*='rounded-xl']")
      .filter({ hasText: "ストレッチ＆モビリティ" });
    await row.getByTitle("削除").click();

    // Verify dialog appeared with correct message
    expect(dialogMessage).toContain("削除しますか");
  });

  test("ADMIN-081: 確認OKで動画が削除される", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    // Accept dialog
    page.on("dialog", (dialog) => dialog.accept());

    const row = page
      .locator("[class*='rounded-xl']")
      .filter({ hasText: "ストレッチ＆モビリティ" });
    await row.getByTitle("削除").click();
    await expect(page.getByText("動画を削除しました")).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════
  // Section 9: Embed Share
  // ═══════════════════════════════════════════════════════════

  test("ADMIN-090: Embed URLをコピーできる", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos");

    // Grant clipboard permissions
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    const row = page
      .locator("[class*='rounded-xl']")
      .filter({ hasText: "ストレッチ＆モビリティ" });
    await row.getByTitle("Embed URLをコピー").click();
    await expect(page.getByText("Embed URLをコピーしました")).toBeVisible();
  });

  test("ADMIN-091: 編集ページにEmbedセクションが表示される", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos/stretch-full");

    await expect(page.getByText("動画を編集")).toBeVisible();

    // Embed section
    await expect(page.getByText("Embed").first()).toBeVisible();
    await expect(page.getByText(/\/embed\/stretch-full/).first()).toBeVisible();
  });

  test("ADMIN-093: iframeスニペットが正しく表示される", async ({ page }) => {
    await setupAdmin(page);
    await page.goto("/admin/videos/stretch-full");

    await expect(page.getByText("動画を編集")).toBeVisible();

    // iframe snippet with correct src
    await expect(page.getByText(/iframe/).first()).toBeVisible();
    await expect(page.getByText(/layout=equal/).first()).toBeVisible();
  });

  test("ADMIN-095: Embed URLでプレイヤーが表示される（認証不要）", async ({
    page,
  }) => {
    await setupViewer(page);
    await page.goto("/embed/stretch-full");

    // Embed page loads without auth
    await expect(page.locator("video").first()).toBeVisible();

    // Layout switcher visible (rich mode)
    await expect(page.getByTitle("シングルビュー")).toBeVisible();
    await expect(page.getByTitle("均等並び")).toBeVisible();
    await expect(page.getByTitle("メイン+サブ")).toBeVisible();
  });

  test("ADMIN-098: 存在しない動画のEmbed URLでエラー表示", async ({ page }) => {
    await setupViewer(page);
    await page.goto("/embed/nonexistent-video");

    await expect(page.getByText("動画が見つかりません")).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════
  // Section 10: Ingest App Connection
  // ═══════════════════════════════════════════════════════════

  test("ADMIN-100: ダッシュボードに「動画を追加する」セクションが表示される", async ({
    page,
  }) => {
    await setupAdmin(page);
    await page.goto("/admin");

    await expect(page.getByText("動画を追加する")).toBeVisible();
    await expect(page.getByText("Mac Ingest App")).toBeVisible();
    await expect(page.getByText("手動で追加")).toBeVisible();
  });

  test("ADMIN-102: Ingest App接続設定コピーボタンが動作する", async ({
    page,
  }) => {
    await setupAdmin(page);
    await page.goto("/admin");

    // Grant clipboard permissions
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    const copyBtn = page.getByText("Ingest App 接続設定をコピー");
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Button text changes after click
    await expect(
      page.getByText("コピーしました — Ingest App に貼り付けてください"),
    ).toBeVisible();
  });

  test("ADMIN-105: 「新規動画を追加」ボタンで作成ページに遷移する", async ({
    page,
  }) => {
    await setupAdmin(page);
    await page.goto("/admin");

    await page.getByText("新規動画を追加").click();
    await page.waitForURL("**/admin/videos/new");
  });
});

/**
 * E2E テストフィクスチャ
 * Auth不要（VITE_SUPABASE_URL未設定 → AuthGateがデモモードで通過）
 * CDN・APIはPlaywrightでインターセプト
 */
import { test as base, expect, type Page } from "@playwright/test";

// ─── Mock API Data ──────────────────────────────────────────

export const MOCK_API_VIDEOS = [
  {
    id: "stretch-full",
    title: "ストレッチ＆モビリティ — フルセッション",
    description: "撮影日のウォームアップとして行ったマット上でのストレッチ。",
    category: "training",
    chapter: "ストレッチ",
    recordedAt: "2026-03-16",
    durationSeconds: 612,
    status: "published",
    angles: [
      {
        id: "stretch-full-front",
        label: "正面",
        hlsUrl: "https://test-cdn.b-cdn.net/mock1/playlist.m3u8",
        thumbnailUrl: "https://test-cdn.b-cdn.net/mock1/thumbnail.jpg",
        subtitleUrl: "/subs/stretch.vtt",
      },
      {
        id: "stretch-full-side",
        label: "側面",
        hlsUrl: "https://test-cdn.b-cdn.net/mock2/playlist.m3u8",
        thumbnailUrl: "https://test-cdn.b-cdn.net/mock2/thumbnail.jpg",
      },
    ],
    chapters: [],
    createdAt: "2026-03-16T00:00:00Z",
    updatedAt: "2026-03-16T00:00:00Z",
  },
  {
    id: "running-form",
    title: "トレッドミルでランニングフォーム分析",
    description:
      "トレーナー指導のもと、トレッドミルを使ったランニングフォームのチェック。",
    category: "training",
    chapter: "ランニング",
    recordedAt: "2026-03-16",
    durationSeconds: 99,
    status: "published",
    angles: [
      {
        id: "running-form-front",
        label: "正面",
        hlsUrl: "https://test-cdn.b-cdn.net/mock3/playlist.m3u8",
        thumbnailUrl: "https://test-cdn.b-cdn.net/mock3/thumbnail.jpg",
      },
    ],
    chapters: [],
    createdAt: "2026-03-16T00:00:00Z",
    updatedAt: "2026-03-16T01:00:00Z",
  },
  {
    id: "squat-lunge",
    title: "バーベルスクワット＆ランジ",
    description: "下半身トレーニング。",
    category: "drill",
    chapter: "ウェイトトレーニング",
    recordedAt: "2026-03-16",
    durationSeconds: 197,
    status: "draft",
    angles: [
      {
        id: "squat-lunge-front",
        label: "正面",
        hlsUrl: "https://test-cdn.b-cdn.net/mock4/playlist.m3u8",
        thumbnailUrl: "https://test-cdn.b-cdn.net/mock4/thumbnail.jpg",
      },
    ],
    chapters: [],
    createdAt: "2026-03-16T00:00:00Z",
    updatedAt: "2026-03-16T02:00:00Z",
  },
];

// ─── CDN Mock ───────────────────────────────────────────────

const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

export async function setupCdnMock(page: Page) {
  await page.route("**/*.b-cdn.net/**", async (route) => {
    const url = route.request().url();
    if (url.includes("thumbnail")) {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        body: PIXEL_PNG,
      });
    } else if (url.includes("playlist.m3u8")) {
      await route.fulfill({
        status: 200,
        contentType: "application/vnd.apple.mpegurl",
        body: "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXT-X-ENDLIST\n",
      });
    } else {
      await route.fulfill({ status: 404 });
    }
  });
}

// ─── API Mock ───────────────────────────────────────────────

export async function setupApiMock(page: Page) {
  await page.route("**/api/videos", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_API_VIDEOS),
      });
    } else if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ...body,
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          angles: (body.angles || []).map(
            (a: Record<string, string>) => ({
              ...a,
              hlsUrl: `https://test-cdn.b-cdn.net/${a.bunnyStreamId || "x"}/playlist.m3u8`,
              thumbnailUrl: `https://test-cdn.b-cdn.net/${a.bunnyStreamId || "x"}/thumbnail.jpg`,
            }),
          ),
        }),
      });
    }
  });

  await page.route("**/api/videos/*", async (route) => {
    const url = route.request().url();
    const id = decodeURIComponent(
      url.split("/api/videos/")[1]?.split("?")[0] || "",
    );
    const video = MOCK_API_VIDEOS.find((v) => v.id === id);
    const method = route.request().method();

    if (method === "GET") {
      if (video) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(video),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: "Not found" }),
        });
      }
    } else if (method === "DELETE") {
      await route.fulfill({ status: 204 });
    } else if (method === "PATCH") {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...video, ...body }),
      });
    } else if (method === "PUT") {
      const body = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...video,
          ...body,
          updatedAt: new Date().toISOString(),
        }),
      });
    }
  });

  await page.route("**/api/admin/stats", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        totalVideos: 7,
        totalDurationSeconds: 2667,
        totalCategories: 3,
        statusCounts: { draft: 2, published: 5, archived: 0 },
        recentVideos: MOCK_API_VIDEOS.slice(0, 3).map((v) => ({
          id: v.id,
          title: v.title,
          category: v.category,
          updatedAt: v.updatedAt,
        })),
      }),
    });
  });
}

// ─── Setup Helpers ──────────────────────────────────────────

/** Viewer pages: CDN mocked, no API needed (uses static data) */
export async function setupViewer(page: Page) {
  await setupCdnMock(page);
}

/** Admin pages: CDN + API mocked, admin token set */
export async function setupAdmin(page: Page) {
  await setupCdnMock(page);
  await setupApiMock(page);
  await page.addInitScript(() => {
    sessionStorage.setItem("thestandard_admin_token", "test-admin-token");
  });
}

// ─── Re-export ──────────────────────────────────────────────

export const test = base;
export { expect };

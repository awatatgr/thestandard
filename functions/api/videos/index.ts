import { resolveVideo } from "../_shared/seed";
import type { VideoData } from "../_shared/seed";
import { getAllVideos, putVideo, addToIndex, getVideo, getSeedVideos } from "../_shared/kv";

interface Env {
  VIDEOS_KV?: KVNamespace;
  BUNNY_CDN_HOSTNAME?: string;
  ADMIN_TOKEN?: string;
}

// GET /api/videos
export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  let videos: VideoData[];
  if (env.VIDEOS_KV) {
    videos = await getAllVideos(env.VIDEOS_KV);
  } else {
    videos = getSeedVideos();
  }

  // Filter by status
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const hasAuth = request.headers.get("Authorization")?.startsWith("Bearer ");
  if (statusFilter) {
    videos = videos.filter(v => v.status === statusFilter);
  } else if (!hasAuth) {
    // Public API (no auth) only returns published videos
    videos = videos.filter(v => v.status === "published");
  }

  // Filter by category if param provided
  const categoryFilter = url.searchParams.get("category");
  if (categoryFilter) {
    videos = videos.filter(v => v.category === categoryFilter);
  }

  // Search by title/description
  const q = url.searchParams.get("q");
  if (q) {
    const lower = q.toLowerCase();
    videos = videos.filter(v =>
      v.title.toLowerCase().includes(lower) ||
      (v.description || "").toLowerCase().includes(lower)
    );
  }

  const cdnHostname = env.BUNNY_CDN_HOSTNAME || "";
  const resolved = videos.map(v => resolveVideo(v, cdnHostname));
  return Response.json(resolved);
};

// POST /api/videos
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.VIDEOS_KV) {
    return Response.json({ error: "KV not configured" }, { status: 503 });
  }

  let video: VideoData;
  try {
    video = await request.json<VideoData>();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!video.id || !video.title || !video.angles?.length) {
    return Response.json({ error: "Missing required fields: id, title, angles" }, { status: 400 });
  }

  // Check for duplicate
  const existing = await getVideo(env.VIDEOS_KV, video.id);
  if (existing) {
    return Response.json({ error: "Video with this ID already exists" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const newVideo: VideoData = {
    ...video,
    status: video.status || "draft",
    createdAt: now,
    updatedAt: now,
  };

  await putVideo(env.VIDEOS_KV, newVideo);
  await addToIndex(env.VIDEOS_KV, newVideo.id);

  const cdnHostname = env.BUNNY_CDN_HOSTNAME || "";
  return Response.json(resolveVideo(newVideo, cdnHostname), { status: 201 });
};

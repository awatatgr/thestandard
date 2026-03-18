import { resolveVideo } from "../_shared/seed";
import type { VideoData } from "../_shared/seed";
import { getVideo, putVideo, deleteVideoData, getSeedVideos } from "../_shared/kv";

interface Env {
  VIDEOS_KV?: KVNamespace;
  BUNNY_CDN_HOSTNAME?: string;
  ADMIN_TOKEN?: string;
}

// GET /api/videos/:id
export const onRequestGet: PagesFunction<Env> = async ({ env, params, request }) => {
  const id = params.id as string;
  let video: VideoData | null = null;

  if (env.VIDEOS_KV) {
    video = await getVideo(env.VIDEOS_KV, id);
  }
  if (!video) {
    const seed = getSeedVideos();
    video = seed.find(v => v.id === id) || null;
  }
  if (!video) {
    return Response.json({ error: "Video not found" }, { status: 404 });
  }

  // Public API (no auth) only returns published videos
  const hasAuth = request.headers.get("Authorization")?.startsWith("Bearer ");
  if (!hasAuth && video.status !== "published") {
    return Response.json({ error: "Video not found" }, { status: 404 });
  }

  const cdnHostname = env.BUNNY_CDN_HOSTNAME || "";
  return Response.json(resolveVideo(video, cdnHostname));
};

// PUT /api/videos/:id
export const onRequestPut: PagesFunction<Env> = async ({ env, params, request }) => {
  if (!env.VIDEOS_KV) {
    return Response.json({ error: "KV not configured" }, { status: 503 });
  }

  const id = params.id as string;
  const existing = await getVideo(env.VIDEOS_KV, id);
  if (!existing) {
    return Response.json({ error: "Video not found" }, { status: 404 });
  }

  let update: VideoData;
  try {
    update = await request.json<VideoData>();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!update.title || !update.angles?.length) {
    return Response.json({ error: "Missing required fields: title, angles" }, { status: 400 });
  }

  const updatedVideo: VideoData = {
    ...update,
    id,
    status: update.status || existing.status,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await putVideo(env.VIDEOS_KV, updatedVideo);

  const cdnHostname = env.BUNNY_CDN_HOSTNAME || "";
  return Response.json(resolveVideo(updatedVideo, cdnHostname));
};

// PATCH /api/videos/:id (partial update / status change)
export const onRequestPatch: PagesFunction<Env> = async ({ env, params, request }) => {
  if (!env.VIDEOS_KV) {
    return Response.json({ error: "KV not configured" }, { status: 503 });
  }

  const id = params.id as string;
  const existing = await getVideo(env.VIDEOS_KV, id);
  if (!existing) {
    return Response.json({ error: "Video not found" }, { status: 404 });
  }

  let patch: Partial<VideoData>;
  try {
    patch = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updatedVideo: VideoData = {
    ...existing,
    ...patch,
    id, // don't allow id change
    createdAt: existing.createdAt, // don't allow createdAt change
    updatedAt: new Date().toISOString(),
  };

  await putVideo(env.VIDEOS_KV, updatedVideo);

  const cdnHostname = env.BUNNY_CDN_HOSTNAME || "";
  return Response.json(resolveVideo(updatedVideo, cdnHostname));
};

// DELETE /api/videos/:id
export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  if (!env.VIDEOS_KV) {
    return Response.json({ error: "KV not configured" }, { status: 503 });
  }

  const id = params.id as string;
  const existing = await getVideo(env.VIDEOS_KV, id);
  if (!existing) {
    return Response.json({ error: "Video not found" }, { status: 404 });
  }

  await deleteVideoData(env.VIDEOS_KV, id);
  return new Response(null, { status: 204 });
};

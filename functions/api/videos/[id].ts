import { seedVideos, resolveVideo } from "../_shared/seed";
import type { VideoData } from "../_shared/seed";

interface Env {
  VIDEOS_KV?: KVNamespace;
  BUNNY_CDN_HOSTNAME?: string;
}

async function getVideos(env: Env): Promise<VideoData[]> {
  if (env.VIDEOS_KV) {
    const stored = await env.VIDEOS_KV.get<VideoData[]>("videos", "json");
    if (stored) return stored;
  }
  return structuredClone(seedVideos);
}

// GET /api/videos/:id
export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const id = params.id as string;
  const videos = await getVideos(env);
  const video = videos.find((v) => v.id === id);
  if (!video) {
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
  let update: VideoData;
  try {
    update = await request.json<VideoData>();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!update.title || !update.angles?.length) {
    return Response.json({ error: "Missing required fields: title, angles" }, { status: 400 });
  }

  const videos = await getVideos(env);
  const index = videos.findIndex((v) => v.id === id);
  if (index === -1) {
    return Response.json({ error: "Video not found" }, { status: 404 });
  }

  videos[index] = { ...update, id };
  await env.VIDEOS_KV.put("videos", JSON.stringify(videos));

  const cdnHostname = env.BUNNY_CDN_HOSTNAME || "";
  return Response.json(resolveVideo(videos[index], cdnHostname));
};

// DELETE /api/videos/:id
export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  if (!env.VIDEOS_KV) {
    return Response.json({ error: "KV not configured" }, { status: 503 });
  }

  const id = params.id as string;
  const videos = await getVideos(env);
  const index = videos.findIndex((v) => v.id === id);
  if (index === -1) {
    return Response.json({ error: "Video not found" }, { status: 404 });
  }

  videos.splice(index, 1);
  await env.VIDEOS_KV.put("videos", JSON.stringify(videos));

  return new Response(null, { status: 204 });
};

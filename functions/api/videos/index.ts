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

// GET /api/videos
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const videos = await getVideos(env);
  const cdnHostname = env.BUNNY_CDN_HOSTNAME || "";
  const resolved = videos.map((v) => resolveVideo(v, cdnHostname));
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

  const videos = await getVideos(env);
  if (videos.find((v) => v.id === video.id)) {
    return Response.json({ error: "Video with this ID already exists" }, { status: 409 });
  }

  videos.push(video);
  await env.VIDEOS_KV.put("videos", JSON.stringify(videos));

  const cdnHostname = env.BUNNY_CDN_HOSTNAME || "";
  return Response.json(resolveVideo(video, cdnHostname), { status: 201 });
};

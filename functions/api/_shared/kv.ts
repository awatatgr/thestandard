import type { VideoData } from "./seed";
import { seedVideos } from "./seed";

// Migration: old "videos" array -> new video:{id} + video:index format
async function migrateIfNeeded(kv: KVNamespace): Promise<void> {
  const oldData = await kv.get<VideoData[]>("videos", "json");
  if (!oldData) return;

  const ids: string[] = [];
  for (const video of oldData) {
    await kv.put(`video:${video.id}`, JSON.stringify({
      ...video,
      status: video.status || "published",
      createdAt: video.createdAt || new Date().toISOString(),
      updatedAt: video.updatedAt || new Date().toISOString(),
    }));
    ids.push(video.id);
  }
  await kv.put("video:index", JSON.stringify(ids));
  await kv.delete("videos");
}

export async function getVideoIndex(kv: KVNamespace): Promise<string[]> {
  await migrateIfNeeded(kv);
  const index = await kv.get<string[]>("video:index", "json");
  return index || [];
}

export async function getVideo(kv: KVNamespace, id: string): Promise<VideoData | null> {
  return kv.get<VideoData>(`video:${id}`, "json");
}

export async function getAllVideos(kv: KVNamespace): Promise<VideoData[]> {
  const ids = await getVideoIndex(kv);
  const videos: VideoData[] = [];
  for (const id of ids) {
    const video = await getVideo(kv, id);
    if (video) videos.push(video);
  }
  return videos;
}

export async function putVideo(kv: KVNamespace, video: VideoData): Promise<void> {
  await kv.put(`video:${video.id}`, JSON.stringify(video));
}

export async function addToIndex(kv: KVNamespace, id: string): Promise<void> {
  const ids = await getVideoIndex(kv);
  if (!ids.includes(id)) {
    ids.push(id);
    await kv.put("video:index", JSON.stringify(ids));
  }
}

export async function removeFromIndex(kv: KVNamespace, id: string): Promise<void> {
  const ids = await getVideoIndex(kv);
  const filtered = ids.filter(i => i !== id);
  await kv.put("video:index", JSON.stringify(filtered));
}

export async function deleteVideoData(kv: KVNamespace, id: string): Promise<void> {
  await kv.delete(`video:${id}`);
  await removeFromIndex(kv, id);
}

// Seed fallback when KV is not available
export function getSeedVideos(): VideoData[] {
  return seedVideos.map(v => ({
    ...v,
    status: v.status || ("published" as const),
    createdAt: v.createdAt || "2026-03-16T00:00:00Z",
    updatedAt: v.updatedAt || "2026-03-16T00:00:00Z",
  }));
}

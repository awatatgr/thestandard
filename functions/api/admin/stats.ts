import type { VideoData } from "../_shared/seed";
import { getAllVideos, getSeedVideos } from "../_shared/kv";

interface Env {
  VIDEOS_KV?: KVNamespace;
  ADMIN_TOKEN?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  let videos: VideoData[];
  if (env.VIDEOS_KV) {
    videos = await getAllVideos(env.VIDEOS_KV);
  } else {
    videos = getSeedVideos();
  }

  const totalDuration = videos.reduce((sum, v) => sum + (v.durationSeconds || 0), 0);
  const categories = new Set(videos.map(v => v.category));
  const statusCounts = {
    draft: videos.filter(v => v.status === "draft").length,
    published: videos.filter(v => v.status === "published").length,
    archived: videos.filter(v => v.status === "archived").length,
  };

  return Response.json({
    totalVideos: videos.length,
    totalDurationSeconds: totalDuration,
    totalCategories: categories.size,
    statusCounts,
    recentVideos: videos
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
      .slice(0, 5)
      .map(v => ({ id: v.id, title: v.title, category: v.category, updatedAt: v.updatedAt })),
  });
};

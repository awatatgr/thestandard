import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { VideoCard } from "@/components/videos/VideoCard";
import { Badge } from "@/components/ui/badge";
import { videos, VIDEO_CATEGORIES, getPrimaryThumbnail, type VideoCategoryKey } from "@/data/videos";
import { Play, Clock, Layers } from "lucide-react";

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VideoListPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<VideoCategoryKey | "all">("all");

  const heroVideo = videos[0];
  const restVideos = videos.slice(1);
  const filtered =
    activeCategory === "all"
      ? restVideos
      : restVideos.filter((v) => v.category === activeCategory);

  const heroThumbnail = heroVideo ? getPrimaryThumbnail(heroVideo) : "";
  const heroCategory = heroVideo ? VIDEO_CATEGORIES[heroVideo.category] : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero section */}
      {heroVideo && (
        <section
          className="relative cursor-pointer group"
          onClick={() => navigate(`/videos/${heroVideo.id}`)}
        >
          <div className="aspect-[21/9] sm:aspect-[21/9] max-h-[420px] w-full overflow-hidden">
            {heroThumbnail ? (
              <img
                src={heroThumbnail}
                alt={heroVideo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950" />
            )}
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="container">
              <div className="flex items-center gap-2 mb-2">
                {heroCategory && (
                  <Badge className={heroCategory.color} variant="secondary">
                    {heroCategory.label}
                  </Badge>
                )}
                {heroVideo.chapter && (
                  <span className="text-xs text-zinc-400">{heroVideo.chapter}</span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
                {heroVideo.title}
              </h2>
              {heroVideo.description && (
                <p className="text-sm text-zinc-400 max-w-xl mb-4 line-clamp-2">
                  {heroVideo.description}
                </p>
              )}
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 sm:px-5 sm:py-2.5 rounded-lg font-medium transition-colors">
                  <Play className="h-4 w-4" />
                  再生する
                </button>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  {heroVideo.durationSeconds && heroVideo.durationSeconds > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(heroVideo.durationSeconds)}
                    </span>
                  )}
                  {heroVideo.angles.length > 1 && (
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {heroVideo.angles.length} アングル
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="container py-6">
        {/* Category filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none pb-1">
          <button
            className={`px-4 py-2 sm:px-3 sm:py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
            onClick={() => setActiveCategory("all")}
          >
            すべて
          </button>
          {(Object.entries(VIDEO_CATEGORIES) as [VideoCategoryKey, (typeof VIDEO_CATEGORIES)[VideoCategoryKey]][]).map(
            ([key, cat]) => (
              <button
                key={key}
                className={`px-4 py-2 sm:px-3 sm:py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  activeCategory === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
                onClick={() => setActiveCategory(key)}
              >
                {cat.label}
              </button>
            ),
          )}
        </div>

        {/* Video grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">動画がありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => navigate(`/videos/${video.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

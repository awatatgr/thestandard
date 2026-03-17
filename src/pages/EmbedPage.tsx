import { useParams, useSearchParams } from "react-router-dom";
import { useCallback, useEffect } from "react";
import { VideoPlayer } from "@/components/videos/VideoPlayer";
import { MultiViewPlayer } from "@/components/videos/MultiViewPlayer";
import type { MultiViewLayout } from "@/components/videos/MultiViewPlayer";
import { videos, getAngleSrc, getAngleThumbnailUrl } from "@/data/videos";

export default function EmbedPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const [searchParams] = useSearchParams();

  const layout = (searchParams.get("layout") as MultiViewLayout) || "equal";
  const subtitles = searchParams.get("subtitles") === "on";

  const video = videos.find((v) => v.id === videoId);

  // postMessage API for parent window communication
  const postMsg = useCallback(
    (type: string, data?: Record<string, unknown>) => {
      if (window.parent !== window) {
        window.parent.postMessage({ source: "thestandard", type, ...data }, "*");
      }
    },
    [],
  );

  // Notify parent when ready
  useEffect(() => {
    postMsg("thestandard:ready", { videoId });
  }, [videoId, postMsg]);

  // Listen for commands from parent
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.source !== "thestandard-host") return;
      // Future: handle play/pause/seek commands from parent
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      postMsg("thestandard:timeupdate", { currentTime, duration });
    },
    [postMsg],
  );

  if (!video) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-500 text-sm">動画が見つかりません</p>
      </div>
    );
  }

  // Single angle — use VideoPlayer directly
  if (video.angles.length === 1) {
    const angle = video.angles[0];
    const { hlsUrl, fallbackUrl } = getAngleSrc(angle);
    const thumbnail = getAngleThumbnailUrl(angle);
    return (
      <div className="w-screen h-screen bg-black">
        <VideoPlayer
          hlsUrl={hlsUrl}
          fallbackUrl={fallbackUrl}
          poster={thumbnail}
          onTimeUpdate={handleTimeUpdate}
          subtitleUrl={angle.subtitleUrl}
          subtitlesEnabled={subtitles}
          className="w-full h-full"
        />
      </div>
    );
  }

  // Multi angle — use MultiViewPlayer
  return (
    <div className="w-screen h-screen bg-black flex flex-col">
      <div className="flex-1 min-h-0">
        <MultiViewPlayer
          angles={video.angles}
          onTimeUpdate={handleTimeUpdate}
          layout={layout}
          subtitlesEnabled={subtitles}
          exercises={video.exercises}
        />
      </div>
    </div>
  );
}

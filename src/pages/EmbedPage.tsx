import { useParams, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VideoPlayer, type VideoPlayerHandle } from "@/components/videos/VideoPlayer";
import { MultiViewPlayer, type MultiViewPlayerHandle, type MultiViewLayout } from "@/components/videos/MultiViewPlayer";
import { ExerciseOverlay } from "@/components/videos/ExerciseOverlay";
import { videos, getAngleSrc, getAngleThumbnailUrl } from "@/data/videos";
import { Monitor, Columns, LayoutGrid, Subtitles, List, ChevronDown } from "lucide-react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function EmbedPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const [searchParams] = useSearchParams();

  const controlsMode = searchParams.get("controls"); // null = rich, "minimal" = simple
  const isMinimal = controlsMode === "minimal";
  const initialLayout = (searchParams.get("layout") as MultiViewLayout) || "equal";
  const initialSubtitles = searchParams.get("subtitles") === "on";

  const video = videos.find((v) => v.id === videoId);
  const hasMultipleAngles = video ? video.angles.length > 1 : false;
  const hasChapters = !!video?.exercises?.length;
  const hasSubtitles = video?.angles.some((a) => a.subtitleUrl) || false;

  // State for rich controls
  const [viewMode, setViewMode] = useState<"single" | "equal" | "main-sub">(
    hasMultipleAngles ? (initialLayout === "main-sub" ? "main-sub" : "equal") : "single",
  );
  const [selectedAngleIndex, setSelectedAngleIndex] = useState(0);
  const [subtitlesOn, setSubtitlesOn] = useState(initialSubtitles || hasSubtitles);
  const [currentTime, setCurrentTime] = useState(0);
  const [chaptersOpen, setChaptersOpen] = useState(false);

  const playerRef = useRef<VideoPlayerHandle>(null);
  const multiPlayerRef = useRef<MultiViewPlayerHandle>(null);

  // postMessage API for parent window communication
  const postMsg = useCallback(
    (type: string, data?: Record<string, unknown>) => {
      if (window.parent !== window) {
        window.parent.postMessage({ source: "thestandard", type, ...data }, "*");
      }
    },
    [],
  );

  useEffect(() => {
    postMsg("thestandard:ready", { videoId });
  }, [videoId, postMsg]);

  // Listen for commands from parent (minimal mode)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.source !== "thestandard-host") return;
      const { command, value } = e.data;
      if (command === "seek" && typeof value === "number") {
        if (viewMode === "single") playerRef.current?.seekTo(value);
        else multiPlayerRef.current?.seekTo(value);
      } else if (command === "setLayout" && typeof value === "string") {
        if (value === "single" || value === "equal" || value === "main-sub") setViewMode(value);
      } else if (command === "setSubtitles" && typeof value === "boolean") {
        setSubtitlesOn(value);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [viewMode]);

  const handleTimeUpdate = useCallback(
    (time: number, duration?: number) => {
      setCurrentTime(time);
      postMsg("thestandard:timeupdate", { currentTime: time, duration: duration || 0 });
    },
    [postMsg],
  );

  const handleSeek = useCallback(
    (seconds: number) => {
      if (viewMode === "single") playerRef.current?.seekTo(seconds);
      else multiPlayerRef.current?.seekTo(seconds);
    },
    [viewMode],
  );

  // Active chapter
  const activeChapter = useMemo(() => {
    if (!video?.exercises) return null;
    const idx = video.exercises.findIndex(
      (ex) => currentTime >= ex.startSeconds && currentTime < ex.endSeconds,
    );
    return idx >= 0 ? { index: idx, exercise: video.exercises[idx] } : null;
  }, [video?.exercises, currentTime]);

  if (!video) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-500 text-sm">動画が見つかりません</p>
      </div>
    );
  }

  // ============================================================
  // MINIMAL MODE — video only, no UI controls, postMessage driven
  // ============================================================
  if (isMinimal) {
    if (video.angles.length === 1) {
      const angle = video.angles[0];
      const { hlsUrl, fallbackUrl } = getAngleSrc(angle);
      const thumbnail = getAngleThumbnailUrl(angle);
      return (
        <div className="w-screen h-screen bg-black">
          <VideoPlayer
            ref={playerRef}
            hlsUrl={hlsUrl}
            fallbackUrl={fallbackUrl}
            poster={thumbnail}
            onTimeUpdate={handleTimeUpdate}
            subtitleUrl={angle.subtitleUrl}
            subtitlesEnabled={subtitlesOn}
            className="w-full h-full"
          />
        </div>
      );
    }
    return (
      <div className="w-screen h-screen bg-black flex flex-col">
        <div className="flex-1 min-h-0">
          <MultiViewPlayer
            ref={multiPlayerRef}
            angles={video.angles}
            onTimeUpdate={handleTimeUpdate}
            layout={viewMode === "main-sub" ? "main-sub" : "equal"}
            subtitlesEnabled={subtitlesOn}
            exercises={video.exercises}
          />
        </div>
      </div>
    );
  }

  // ============================================================
  // RICH MODE — full UI controls inside iframe
  // ============================================================
  const selectedAngle = video.angles[selectedAngleIndex];
  const { hlsUrl, fallbackUrl } = getAngleSrc(selectedAngle);
  const thumbnail = getAngleThumbnailUrl(selectedAngle);

  return (
    <div className="w-screen h-screen bg-black flex flex-col overflow-hidden">
      {/* Top toolbar: layout + subtitle controls */}
      {(hasMultipleAngles || hasSubtitles || hasChapters) && (
        <div className="flex items-center gap-1 px-2 py-1 bg-zinc-950 border-b border-zinc-800/40 shrink-0">
          {/* Layout switcher */}
          {hasMultipleAngles && (
            <>
              <button
                className={`p-1.5 rounded transition-colors ${viewMode === "single" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                onClick={() => setViewMode("single")}
                title="シングルビュー"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                className={`p-1.5 rounded transition-colors ${viewMode === "equal" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                onClick={() => setViewMode("equal")}
                title="均等並び"
              >
                <Columns className="h-3.5 w-3.5" />
              </button>
              <button
                className={`p-1.5 rounded transition-colors ${viewMode === "main-sub" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                onClick={() => setViewMode("main-sub")}
                title="メイン+サブ"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {/* Subtitle toggle */}
          {hasSubtitles && (
            <>
              {hasMultipleAngles && <div className="w-px h-4 bg-zinc-800 mx-0.5" />}
              <button
                className={`p-1.5 rounded transition-colors ${subtitlesOn ? "bg-primary/80 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                onClick={() => setSubtitlesOn(!subtitlesOn)}
                title={subtitlesOn ? "字幕OFF" : "字幕ON"}
              >
                <Subtitles className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {/* Chapter toggle */}
          {hasChapters && (
            <>
              <div className="w-px h-4 bg-zinc-800 mx-0.5" />
              <button
                className={`p-1.5 rounded transition-colors flex items-center gap-1 ${chaptersOpen ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                onClick={() => setChaptersOpen(!chaptersOpen)}
                title="チャプター"
              >
                <List className="h-3.5 w-3.5" />
                <span className="text-[10px]">{video.exercises!.length}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${chaptersOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Current chapter indicator */}
              {activeChapter && !chaptersOpen && (
                <>
                  <div className="w-px h-4 bg-zinc-800 mx-0.5" />
                  <span className="text-[10px] text-zinc-400 truncate max-w-[160px]">
                    <span className="text-primary font-bold">{activeChapter.index + 1}</span>
                    <span className="text-zinc-600">/{video.exercises!.length}</span>
                    {" "}
                    {activeChapter.exercise.name}
                  </span>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Chapter panel (collapsible) */}
        {chaptersOpen && hasChapters && (
          <div className="max-h-48 overflow-y-auto bg-zinc-950 border-b border-zinc-800/40 shrink-0 scrollbar-none">
            {video.exercises!.map((ex, i) => {
              const isActive = activeChapter?.index === i;
              const isPast = activeChapter ? i < activeChapter.index : false;
              return (
                <button
                  key={i}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                    isActive ? "bg-zinc-800/50 border-l-2 border-primary" : "border-l-2 border-transparent hover:bg-zinc-900/80"
                  }`}
                  onClick={() => { handleSeek(ex.startSeconds); setChaptersOpen(false); }}
                >
                  <span className={`text-[10px] tabular-nums font-mono w-4 text-right shrink-0 ${
                    isActive ? "text-primary font-bold" : isPast ? "text-zinc-600" : "text-zinc-500"
                  }`}>
                    {i + 1}
                  </span>
                  <span className={`text-xs flex-1 min-w-0 truncate ${
                    isActive ? "text-white font-medium" : isPast ? "text-zinc-500" : "text-zinc-300"
                  }`}>
                    {ex.name}
                  </span>
                  <span className={`text-[10px] tabular-nums font-mono shrink-0 ${
                    isActive ? "text-primary" : "text-zinc-600"
                  }`}>
                    {formatTime(ex.startSeconds)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Video player */}
        <div className="flex-1 min-h-0">
          {viewMode === "single" ? (
            <div className="relative w-full h-full">
              <VideoPlayer
                ref={playerRef}
                hlsUrl={hlsUrl}
                fallbackUrl={fallbackUrl}
                poster={thumbnail}
                onTimeUpdate={handleTimeUpdate}
                subtitleUrl={selectedAngle.subtitleUrl}
                subtitlesEnabled={subtitlesOn}
                className="w-full h-full"
              />
              {hasChapters && (
                <ExerciseOverlay exercises={video.exercises!} currentTime={currentTime} onSeek={handleSeek} />
              )}
            </div>
          ) : (
            <MultiViewPlayer
              ref={multiPlayerRef}
              angles={video.angles}
              onTimeUpdate={handleTimeUpdate}
              layout={viewMode === "main-sub" ? "main-sub" : "equal"}
              subtitlesEnabled={subtitlesOn}
              exercises={video.exercises}
            />
          )}
        </div>

        {/* Single view: angle tabs */}
        {viewMode === "single" && hasMultipleAngles && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border-t border-zinc-800/40 shrink-0 overflow-x-auto scrollbar-none">
            {video.angles.map((angle, index) => (
              <button
                key={angle.id}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedAngleIndex === index
                    ? "bg-primary text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                }`}
                onClick={() => setSelectedAngleIndex(index)}
              >
                {angle.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { VideoPlayer, type VideoPlayerHandle } from "@/components/videos/VideoPlayer";
import { MultiViewPlayer, type MultiViewPlayerHandle } from "@/components/videos/MultiViewPlayer";
import { ExerciseOverlay } from "@/components/videos/ExerciseOverlay";
import { Badge } from "@/components/ui/badge";
import { videos, VIDEO_CATEGORIES, getAngleSrc, getAngleThumbnailUrl, getPrimaryThumbnail, type ExerciseChapter } from "@/data/videos";
import { ArrowLeft, Monitor, LayoutGrid, Columns, Play, Video as VideoIcon, PanelRightClose, PanelRightOpen, Subtitles, ChevronDown, List } from "lucide-react";

type ViewMode = "single" | "multi" | "equal";
type SidebarTab = "videos" | "chapters";

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ChapterList({
  exercises,
  currentTime,
  onSeek,
}: {
  exercises: ExerciseChapter[];
  currentTime: number;
  onSeek: (seconds: number) => void;
}) {
  const activeIndex = useMemo(() => {
    const idx = exercises.findIndex(
      (ex) => currentTime >= ex.startSeconds && currentTime < ex.endSeconds,
    );
    return idx >= 0 ? idx : -1;
  }, [exercises, currentTime]);

  return (
    <div className="divide-y divide-zinc-800/40">
      {exercises.map((ex, i) => {
        const isActive = i === activeIndex;
        const isPast = activeIndex >= 0 && i < activeIndex;
        return (
          <button
            key={i}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              isActive
                ? "bg-zinc-800/50 border-l-2 border-primary"
                : "border-l-2 border-transparent hover:bg-zinc-900/80"
            }`}
            onClick={() => onSeek(ex.startSeconds)}
          >
            <span className={`text-xs tabular-nums font-mono w-5 text-right shrink-0 ${
              isActive ? "text-primary font-bold" : isPast ? "text-zinc-600" : "text-zinc-500"
            }`}>
              {i + 1}
            </span>
            <span className={`text-sm flex-1 min-w-0 truncate ${
              isActive ? "text-white font-medium" : isPast ? "text-zinc-500" : "text-zinc-300"
            }`}>
              {ex.name}
            </span>
            <span className={`text-xs tabular-nums font-mono shrink-0 ${
              isActive ? "text-primary" : "text-zinc-600"
            }`}>
              {formatDuration(ex.startSeconds)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const video = videos.find((v) => v.id === id);

  const hasChapters = !!video?.exercises?.length;

  const [viewMode, setViewMode] = useState<ViewMode>(
    video && video.angles.length === 2 ? "equal" :
    video && video.angles.length > 2 ? "multi" : "single",
  );
  const [selectedAngleIndex, setSelectedAngleIndex] = useState(0);
  const [_currentTime, setCurrentTime] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(hasChapters ? "chapters" : "videos");
  const [chaptersExpanded, setChaptersExpanded] = useState(false);
  const playerRef = useRef<VideoPlayerHandle>(null);
  const multiPlayerRef = useRef<MultiViewPlayerHandle>(null);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleSeek = useCallback((seconds: number) => {
    if (viewMode === "single") {
      playerRef.current?.seekTo(seconds);
    } else {
      multiPlayerRef.current?.seekTo(seconds);
    }
  }, [viewMode]);

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">動画が見つかりません</p>
          <button onClick={() => navigate("/")} className="text-primary hover:underline">
            一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  const categoryInfo = VIDEO_CATEGORIES[video.category];
  const hasMultipleAngles = video.angles.length > 1;
  const hasSubtitles = video.angles.some((a) => a.subtitleUrl);
  const selectedAngle = video.angles[selectedAngleIndex];
  const { hlsUrl, fallbackUrl } = getAngleSrc(selectedAngle);
  const thumbnail = getAngleThumbnailUrl(selectedAngle);

  return (
    <div className="min-h-screen bg-black">
      {/* Title bar */}
      <div className="flex items-center justify-between gap-3 px-4 h-11 bg-zinc-950/80 border-b border-zinc-800/60">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/")}
            className="shrink-0 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-medium text-zinc-200 truncate">{video.title}</h1>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:block shrink-0 p-1.5 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
          title={sidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
        >
          {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </button>
      </div>

      {/* Main content: player + sidebar */}
      <div className="flex flex-col lg:flex-row">
        {/* Left: Player area + meta */}
        <div className="flex-1 min-w-0">
          {/* Layout switcher — directly above video */}
          {(hasMultipleAngles || hasSubtitles) && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-zinc-950 border-b border-zinc-800/40">
              {hasMultipleAngles && <span className="text-[10px] text-zinc-600 mr-1.5 uppercase tracking-wider">Layout</span>}
              <button
                className={`p-2.5 sm:p-1.5 rounded transition-colors ${
                  viewMode === "single" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
                onClick={() => setViewMode("single")}
                title="シングルビュー"
              >
                <Monitor className="h-5 w-5 sm:h-3.5 sm:w-3.5" />
              </button>
              <button
                className={`p-2.5 sm:p-1.5 rounded transition-colors ${
                  viewMode === "equal" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
                onClick={() => setViewMode("equal")}
                title="均等並び"
              >
                <Columns className="h-5 w-5 sm:h-3.5 sm:w-3.5" />
              </button>
              <button
                className={`p-2.5 sm:p-1.5 rounded transition-colors ${
                  viewMode === "multi" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
                onClick={() => setViewMode("multi")}
                title="メイン+サブ"
              >
                <LayoutGrid className="h-5 w-5 sm:h-3.5 sm:w-3.5" />
              </button>

              {hasSubtitles && (
                <>
                  <div className="w-px h-4 bg-zinc-800 mx-1" />
                  <button
                    className={`p-2.5 sm:p-1.5 rounded transition-colors ${
                      subtitlesOn ? "bg-primary/80 text-white" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                    onClick={() => setSubtitlesOn(!subtitlesOn)}
                    title={subtitlesOn ? "字幕OFF" : "字幕ON"}
                  >
                    <Subtitles className="h-5 w-5 sm:h-3.5 sm:w-3.5" />
                  </button>
                </>
              )}
            </div>
          )}

          {viewMode === "single" ? (
            <div className="relative">
              <VideoPlayer
                ref={playerRef}
                hlsUrl={hlsUrl}
                fallbackUrl={fallbackUrl}
                poster={thumbnail}
                onTimeUpdate={handleTimeUpdate}
                subtitleUrl={selectedAngle.subtitleUrl}
                subtitlesEnabled={subtitlesOn}
                className="w-full aspect-video"
              />
              {video.exercises && video.exercises.length > 0 && (
                <ExerciseOverlay exercises={video.exercises} currentTime={_currentTime} onSeek={handleSeek} />
              )}
              {hasMultipleAngles && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-950 border-b border-zinc-800/60 overflow-x-auto scrollbar-none">
                  <span className="text-xs text-zinc-500 shrink-0">アングル:</span>
                  {video.angles.map((angle, index) => (
                    <button
                      key={angle.id}
                      className={`px-4 py-2 sm:px-3 sm:py-1 rounded text-sm sm:text-xs font-medium transition-colors whitespace-nowrap ${
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
          ) : viewMode === "equal" ? (
            <MultiViewPlayer ref={multiPlayerRef} angles={video.angles} onTimeUpdate={handleTimeUpdate} layout="equal" subtitlesEnabled={subtitlesOn} exercises={video.exercises} />
          ) : (
            <MultiViewPlayer ref={multiPlayerRef} angles={video.angles} onTimeUpdate={handleTimeUpdate} layout="main-sub" subtitlesEnabled={subtitlesOn} exercises={video.exercises} />
          )}

          {/* Video info */}
          <div className="px-4 py-4 space-y-3 border-b border-zinc-800/60 lg:border-b-0">
            <div className="flex items-center gap-2 flex-wrap">
              {categoryInfo && (
                <Badge className={categoryInfo.color} variant="secondary">
                  {categoryInfo.label}
                </Badge>
              )}
              {video.chapter && <span className="text-xs text-zinc-500">{video.chapter}</span>}
              {video.recordedAt && <span className="text-xs text-zinc-500">{video.recordedAt}</span>}
              {hasMultipleAngles && (
                <span className="text-xs text-zinc-500">{video.angles.length} アングル</span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">{video.title}</h2>
            {video.description && (
              <p className="text-sm text-zinc-400 leading-relaxed">{video.description}</p>
            )}
          </div>

          {/* Mobile: chapters accordion (lg未満) */}
          {hasChapters && (
            <div className="lg:hidden border-b border-zinc-800/60">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setChaptersExpanded(!chaptersExpanded)}
              >
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-300">
                    チャプター ({video.exercises!.length})
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${chaptersExpanded ? "rotate-180" : ""}`} />
              </button>
              {chaptersExpanded && (
                <ChapterList exercises={video.exercises!} currentTime={_currentTime} onSeek={handleSeek} />
              )}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className={`hidden lg:block lg:border-l border-zinc-800/60 bg-zinc-950/50 transition-all duration-300 ${
          sidebarOpen ? "lg:w-80 xl:w-96" : "lg:w-0 lg:overflow-hidden"
        }`}>
          {/* Sidebar header with tabs */}
          <div className="px-4 py-2.5 border-b border-zinc-800/60">
            {hasChapters ? (
              <div className="flex gap-1">
                <button
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    sidebarTab === "chapters"
                      ? "bg-zinc-700 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  onClick={() => setSidebarTab("chapters")}
                >
                  チャプター
                </button>
                <button
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    sidebarTab === "videos"
                      ? "bg-zinc-700 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  onClick={() => setSidebarTab("videos")}
                >
                  動画一覧
                </button>
              </div>
            ) : (
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-widest">動画一覧</h3>
            )}
          </div>

          {/* Sidebar content */}
          <div className="overflow-y-auto lg:max-h-[calc(100vh-44px-48px)] scrollbar-none">
            {sidebarTab === "chapters" && hasChapters ? (
              <ChapterList exercises={video.exercises!} currentTime={_currentTime} onSeek={handleSeek} />
            ) : (
              videos.map((v) => {
                const isActive = v.id === video.id;
                const thumb = getPrimaryThumbnail(v);
                const cat = VIDEO_CATEGORIES[v.category];
                return (
                  <button
                    key={v.id}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                      isActive
                        ? "bg-zinc-800/50 border-l-2 border-primary"
                        : "hover:bg-zinc-900/80 border-l-2 border-transparent"
                    }`}
                    onClick={() => navigate(`/videos/${v.id}`)}
                  >
                    <div className="relative w-28 shrink-0 aspect-video rounded overflow-hidden bg-zinc-800">
                      {thumb ? (
                        <img src={thumb} alt={v.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <VideoIcon className="h-5 w-5 text-zinc-600" />
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="h-4 w-4 text-white fill-white" />
                        </div>
                      )}
                      {v.durationSeconds && v.durationSeconds > 0 && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs sm:text-[10px] px-1 py-0.5 rounded tabular-nums">
                          {formatDuration(v.durationSeconds)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-zinc-300"}`}>
                        {v.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {cat && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cat.color}`}>
                            {cat.label}
                          </span>
                        )}
                      </div>
                      {v.chapter && (
                        <p className="text-xs text-zinc-600 mt-0.5 truncate">{v.chapter}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

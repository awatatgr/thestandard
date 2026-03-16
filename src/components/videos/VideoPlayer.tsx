import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward,
  ChevronLeft, ChevronRight, Subtitles,
} from "lucide-react";

export interface VideoPlayerHandle {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  play: () => void;
  pause: () => void;
  getVideoElement: () => HTMLVideoElement | null;
}

interface VideoPlayerProps {
  hlsUrl?: string;
  fallbackUrl?: string;
  poster?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onReady?: () => void;
  className?: string;
  compact?: boolean;
  hideControls?: boolean;
  defaultMuted?: boolean;
  subtitleUrl?: string;
}

const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer({ hlsUrl, fallbackUrl, poster, onTimeUpdate, onReady, className, compact, hideControls, defaultMuted, subtitleUrl }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(defaultMuted ?? false);
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showRateMenu, setShowRateMenu] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [subtitlesOn, setSubtitlesOn] = useState(!!subtitleUrl);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const src = hlsUrl || fallbackUrl || "";
    const isHls = !!hlsUrl && (hlsUrl.endsWith(".m3u8") || hlsUrl.includes(".m3u8"));

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = seconds;
          videoRef.current.play();
        }
      },
      getCurrentTime: () => videoRef.current?.currentTime || 0,
      getDuration: () => videoRef.current?.duration || 0,
      play: () => { videoRef.current?.play(); },
      pause: () => { videoRef.current?.pause(); },
      getVideoElement: () => videoRef.current,
    }));

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !src) return;

      setLoadError(null);
      let retryCount = 0;

      if (isHls && Hls.isSupported()) {
        const hls = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 60, enableWorker: false });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoadError(null);
          onReady?.();
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR && retryCount++ <= 2) {
              hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR && retryCount++ <= 2) {
              hls.recoverMediaError();
            } else {
              setLoadError("動画の読み込みに失敗しました");
            }
          }
        });
        hlsRef.current = hls;
        return () => { hls.destroy(); hlsRef.current = null; };
      } else if (isHls && video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        const onMeta = () => onReady?.();
        const onError = () => setLoadError("動画の読み込みに失敗しました");
        video.addEventListener("loadedmetadata", onMeta);
        video.addEventListener("error", onError);
        return () => { video.removeEventListener("loadedmetadata", onMeta); video.removeEventListener("error", onError); };
      } else {
        video.src = src;
        const onMeta = () => onReady?.();
        const onError = () => setLoadError("動画の読み込みに失敗しました");
        video.addEventListener("loadedmetadata", onMeta);
        video.addEventListener("error", onError);
        return () => { video.removeEventListener("loadedmetadata", onMeta); video.removeEventListener("error", onError); };
      }
    }, [src, isHls, onReady]);

    const handleTimeUpdate = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;
      setCurrentTime(video.currentTime);
      setDuration(video.duration);
      onTimeUpdate?.(video.currentTime, video.duration);
    }, [onTimeUpdate]);

    const togglePlay = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) video.play(); else video.pause();
    }, []);

    const toggleMute = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }, []);

    const handleVolumeChange = useCallback((value: number[]) => {
      const video = videoRef.current;
      if (!video) return;
      const vol = value[0];
      video.volume = vol;
      setVolume(vol);
      if (vol === 0) { video.muted = true; setIsMuted(true); }
      else if (video.muted) { video.muted = false; setIsMuted(false); }
    }, []);

    const handleSeek = useCallback((value: number[]) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = value[0];
    }, []);

    const handleRateChange = useCallback((rate: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.playbackRate = rate;
      setPlaybackRate(rate);
      setShowRateMenu(false);
    }, []);

    const skip = useCallback((seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    }, []);

    const stepFrame = useCallback((direction: 1 | -1) => {
      const video = videoRef.current;
      if (!video) return;
      video.pause();
      video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + direction / 30));
    }, []);

    const toggleFullscreen = useCallback(() => {
      const container = containerRef.current;
      const video = videoRef.current;
      if (!container) return;

      if (!(document.fullscreenElement || (document as any).webkitFullscreenElement)) {
        if (container.requestFullscreen) {
          container.requestFullscreen().catch(() => {
            if (video && (video as any).webkitEnterFullscreen) (video as any).webkitEnterFullscreen();
          });
        } else if ((video as any)?.webkitEnterFullscreen) {
          (video as any).webkitEnterFullscreen();
        }
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
      }
    }, []);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
        switch (e.key) {
          case " ": case "k": e.preventDefault(); togglePlay(); break;
          case "ArrowLeft": e.preventDefault(); skip(-5); break;
          case "ArrowRight": e.preventDefault(); skip(5); break;
          case "j": e.preventDefault(); skip(-10); break;
          case "l": e.preventDefault(); skip(10); break;
          case "m": e.preventDefault(); toggleMute(); break;
          case "f": e.preventDefault(); toggleFullscreen(); break;
          case ",": e.preventDefault(); stepFrame(-1); break;
          case ".": e.preventDefault(); stepFrame(1); break;
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [togglePlay, skip, toggleMute, toggleFullscreen, stepFrame]);

    useEffect(() => {
      return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
    }, []);

    // Sync subtitle track mode
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !subtitleUrl) return;
      const trySetTrack = () => {
        if (video.textTracks.length > 0) {
          video.textTracks[0].mode = subtitlesOn ? "showing" : "hidden";
        }
      };
      trySetTrack();
      video.textTracks.addEventListener("addtrack", trySetTrack);
      return () => video.textTracks.removeEventListener("addtrack", trySetTrack);
    }, [subtitlesOn, subtitleUrl]);

    const resetControlsTimeout = useCallback(() => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
      }
    }, [isPlaying]);

    const controlsVisibleOnTouchRef = useRef(false);

    const handleVideoClick = useCallback(() => {
      if ("ontouchstart" in window && !controlsVisibleOnTouchRef.current) return;
      togglePlay();
    }, [togglePlay]);

    const handleTouchStart = useCallback(() => {
      controlsVisibleOnTouchRef.current = showControls;
      resetControlsTimeout();
    }, [showControls, resetControlsTimeout]);

    return (
      <div
        ref={containerRef}
        className={`relative bg-black rounded-lg overflow-hidden group ${className || ""}`}
        onMouseMove={resetControlsTimeout}
        onTouchStart={handleTouchStart}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        tabIndex={0}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          crossOrigin="anonymous"
          poster={poster || undefined}
          muted={defaultMuted}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadedMetadata={() => {
            if (videoRef.current) setDuration(videoRef.current.duration);
          }}
          onClick={handleVideoClick}
          playsInline
        >
          {subtitleUrl && (
            <track kind="subtitles" src={subtitleUrl} srcLang="ja" label="日本語" default />
          )}
        </video>

        {!hideControls && <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent px-3 pb-2.5 pt-12 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="mb-2 cursor-pointer [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 sm:[&_[role=slider]]:h-3.5 sm:[&_[role=slider]]:w-3.5"
          />

          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-0.5 sm:gap-1">
              {!compact && (
                <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-8 w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={() => stepFrame(-1)} title="前のフレーム (,)">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={() => skip(-10)} title="10秒戻る (J)">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20" onClick={togglePlay}>
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={() => skip(10)} title="10秒進む (L)">
                <SkipForward className="h-4 w-4" />
              </Button>
              {!compact && (
                <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-8 w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={() => stepFrame(1)} title="次のフレーム (.)">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              <span className="text-xs text-white/70 ml-1 sm:ml-2 tabular-nums whitespace-nowrap font-mono tracking-tight">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1">
              {!compact && (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={toggleMute} title="ミュート (M)">
                    {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.05}
                    onValueChange={handleVolumeChange}
                    className="hidden sm:flex w-20 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                  />
                </>
              )}

              <div className="relative">
                <button
                  className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/15 rounded font-mono tabular-nums min-w-[36px] text-center"
                  onClick={() => setShowRateMenu(!showRateMenu)}
                  title="再生速度"
                >
                  {playbackRate}x
                </button>
                {showRateMenu && (
                  <div className="absolute bottom-full right-0 mb-1.5 bg-zinc-900/98 border border-zinc-700/60 rounded-lg py-1 min-w-[80px] shadow-xl">
                    {PLAYBACK_RATES.map((rate) => (
                      <button
                        key={rate}
                        className={`block w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-white/10 ${
                          playbackRate === rate ? "text-red-400 font-semibold" : "text-white/80"
                        }`}
                        onClick={() => handleRateChange(rate)}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {subtitleUrl && (
                <Button variant="ghost" size="icon" className={`h-8 w-8 hover:bg-white/15 ${subtitlesOn ? "text-primary" : "text-white/50 hover:text-white"}`} onClick={() => setSubtitlesOn(!subtitlesOn)} title="字幕">
                  <Subtitles className="h-4 w-4" />
                </Button>
              )}

              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={toggleFullscreen} title="フルスクリーン (F)">
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>}

        {(!src || loadError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80">
            <div className="text-zinc-400 text-sm">
              {loadError || "動画を読み込めません"}
            </div>
          </div>
        )}
      </div>
    );
  }
);

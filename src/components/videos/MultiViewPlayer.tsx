import { useRef, useCallback, useEffect, useState, useMemo, forwardRef, useImperativeHandle } from "react";
import { VideoPlayer, type VideoPlayerHandle } from "./VideoPlayer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getAngleSrc, getAngleThumbnailUrl, type VideoAngle, type ExerciseChapter } from "@/data/videos";
import { ExerciseOverlay } from "./ExerciseOverlay";
import {
  Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Link2,
} from "lucide-react";

export type MultiViewLayout = "main-sub" | "equal";

interface MultiViewPlayerProps {
  angles: VideoAngle[];
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  layout?: MultiViewLayout;
  subtitlesEnabled?: boolean;
  exercises?: ExerciseChapter[];
}

const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const SYNC_THRESHOLD = 0.15; // seconds — force-sync when drift exceeds this

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export interface MultiViewPlayerHandle {
  seekTo: (seconds: number) => void;
}

export const MultiViewPlayer = forwardRef<MultiViewPlayerHandle, MultiViewPlayerProps>(function MultiViewPlayer({ angles, onTimeUpdate, layout = "main-sub", subtitlesEnabled, exercises }, ref) {
  const playerRefs = useRef<(VideoPlayerHandle | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine master angle: prefer "メイン", then "正面", fallback to index 0
  const masterIndex = useMemo(() => {
    const mainIdx = angles.findIndex((a) => a.label === "メイン");
    if (mainIdx !== -1) return mainIdx;
    const frontIdx = angles.findIndex((a) => a.label === "正面");
    if (frontIdx !== -1) return frontIdx;
    return 0;
  }, [angles]);

  // Mobile: show one angle at a time with tab switcher
  const [mobileActiveIndex, setMobileActiveIndex] = useState(masterIndex);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [masterPlaying, setMasterPlaying] = useState(false);
  const [masterTime, setMasterTime] = useState(0);
  const [masterDuration, setMasterDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showRateMenu, setShowRateMenu] = useState(false);
  const [pausedIndices, setPausedIndices] = useState<Set<number>>(new Set());
  const [mutedIndices, setMutedIndices] = useState<Set<number>>(() => {
    const s = new Set<number>();
    for (let i = 0; i < angles.length; i++) {
      if (i !== masterIndex) s.add(i);
    }
    return s;
  });
  const isSyncing = useRef(false);
  const [drifts, setDrifts] = useState<number[]>(() => angles.map(() => 0));

  // Time update from master — drives sync
  const handleTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      setMasterTime(currentTime);
      setMasterDuration(duration);
      onTimeUpdate?.(currentTime, duration);

      if (!syncEnabled) return;

      // Measure drift & force-sync other players
      const newDrifts: number[] = [];
      playerRefs.current.forEach((ref, i) => {
        if (i === masterIndex) { newDrifts.push(0); return; }
        if (!ref) { newDrifts.push(0); return; }
        if (pausedIndices.has(i)) { newDrifts.push(NaN); return; }
        const t = ref.getCurrentTime();
        const drift = t - currentTime;
        newDrifts.push(drift);
        if (!isSyncing.current && Math.abs(drift) > SYNC_THRESHOLD) {
          const el = ref.getVideoElement();
          if (el) el.currentTime = currentTime;
        }
      });
      setDrifts(newDrifts);

      if (!isSyncing.current) {
        isSyncing.current = true;
        requestAnimationFrame(() => { isSyncing.current = false; });
      }
    },
    [onTimeUpdate, pausedIndices, syncEnabled, masterIndex],
  );

  // Toggle sync — immediately re-sync all when turning ON
  const toggleSync = useCallback(() => {
    setSyncEnabled((prev) => {
      if (!prev) {
        const masterEl = playerRefs.current[masterIndex]?.getVideoElement();
        if (masterEl) {
          playerRefs.current.forEach((ref, i) => {
            if (i === masterIndex || !ref) return;
            if (pausedIndices.has(i)) return;
            const el = ref.getVideoElement();
            if (el) el.currentTime = masterEl.currentTime;
          });
        }
      }
      return !prev;
    });
  }, [masterIndex, pausedIndices]);

  // Master play/pause
  const masterTogglePlay = useCallback(() => {
    const primary = playerRefs.current[masterIndex]?.getVideoElement();
    if (!primary) return;
    if (primary.paused) {
      playerRefs.current.forEach((ref, i) => {
        if (!ref) return;
        const el = ref.getVideoElement();
        if (!el) return;
        if (i !== masterIndex && syncEnabled) el.currentTime = primary.currentTime;
        el.play();
      });
      setPausedIndices(new Set());
      setMasterPlaying(true);
    } else {
      playerRefs.current.forEach((ref) => ref?.pause());
      setMasterPlaying(false);
    }
  }, [masterIndex, syncEnabled]);

  // Master seek
  const masterSeek = useCallback((value: number[]) => {
    const time = value[0];
    playerRefs.current.forEach((ref) => {
      const el = ref?.getVideoElement();
      if (el) el.currentTime = time;
    });
    setMasterTime(time);
  }, []);

  // Master seek to absolute time (for chapter clicks)
  const masterSeekTo = useCallback((seconds: number) => {
    playerRefs.current.forEach((ref) => {
      const el = ref?.getVideoElement();
      if (el) el.currentTime = seconds;
    });
    setMasterTime(seconds);
  }, []);

  useImperativeHandle(ref, () => ({ seekTo: masterSeekTo }), [masterSeekTo]);

  // Master skip
  const masterSkip = useCallback((seconds: number) => {
    const primary = playerRefs.current[masterIndex]?.getVideoElement();
    if (!primary) return;
    const newTime = Math.max(0, Math.min(primary.duration, primary.currentTime + seconds));
    playerRefs.current.forEach((ref) => {
      const el = ref?.getVideoElement();
      if (el) el.currentTime = newTime;
    });
  }, [masterIndex]);

  // Master rate change
  const masterRateChange = useCallback((rate: number) => {
    playerRefs.current.forEach((ref) => {
      const el = ref?.getVideoElement();
      if (el) el.playbackRate = rate;
    });
    setPlaybackRate(rate);
    setShowRateMenu(false);
  }, []);

  // Master fullscreen
  const masterFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!(document.fullscreenElement || (document as any).webkitFullscreenElement)) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // Individual pause toggle
  const toggleIndividualPause = useCallback((index: number) => {
    setPausedIndices((prev) => {
      const next = new Set(prev);
      const ref = playerRefs.current[index];
      if (!ref) return next;
      if (next.has(index)) {
        next.delete(index);
        const primary = playerRefs.current[masterIndex]?.getVideoElement();
        const el = ref.getVideoElement();
        if (el && primary) {
          if (syncEnabled) el.currentTime = primary.currentTime;
          if (!primary.paused) el.play();
        }
      } else {
        next.add(index);
        ref.pause();
      }
      return next;
    });
  }, [masterIndex, syncEnabled]);

  // Individual mute toggle
  const toggleIndividualMute = useCallback((index: number) => {
    setMutedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      const el = playerRefs.current[index]?.getVideoElement();
      if (el) el.muted = next.has(index);
      return next;
    });
  }, []);

  // Sync play/pause events from master player
  useEffect(() => {
    const primary = playerRefs.current[masterIndex]?.getVideoElement();
    if (!primary) return;
    const onPlay = () => setMasterPlaying(true);
    const onPause = () => setMasterPlaying(false);
    primary.addEventListener("play", onPlay);
    primary.addEventListener("pause", onPause);
    return () => {
      primary.removeEventListener("play", onPlay);
      primary.removeEventListener("pause", onPause);
    };
  }, [angles, masterIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement !== document.body && !containerRef.current?.contains(document.activeElement)) return;
      switch (e.key) {
        case " ": case "k": e.preventDefault(); masterTogglePlay(); break;
        case "j": e.preventDefault(); masterSkip(-10); break;
        case "l": e.preventDefault(); masterSkip(10); break;
        case "ArrowLeft": e.preventDefault(); masterSkip(-5); break;
        case "ArrowRight": e.preventDefault(); masterSkip(5); break;
        case "f": e.preventDefault(); masterFullscreen(); break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [masterTogglePlay, masterSkip, masterFullscreen]);

  // Compute overall sync status for display
  const syncStatus = useMemo(() => {
    if (!syncEnabled) return null;
    const activeDrifts = drifts.filter((_, i) => i !== masterIndex && !isNaN(drifts[i]));
    if (activeDrifts.length === 0) return null;
    const maxDrift = Math.max(...activeDrifts.map(Math.abs));
    return { maxDrift, allSynced: maxDrift < 0.1 };
  }, [drifts, syncEnabled, masterIndex]);

  return (
    <div ref={containerRef} className="bg-black" tabIndex={0}>
      {/* Grid: desktop=multi layout, mobile=single angle (tab-switched) */}
      <div
        className={`grid grid-cols-1 gap-0.5 ${
          layout === "equal"
            ? angles.length <= 2 ? "sm:grid-cols-2" : angles.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
            : layout === "main-sub"
              ? `sm:grid-cols-[2fr_1fr] ${angles.length <= 3 ? "sm:grid-rows-2" : "sm:grid-rows-3"}`
              : ""
        }`}
      >
        {angles.slice(0, 4).map((angle, index) => {
          const { hlsUrl, fallbackUrl } = getAngleSrc(angle);
          const thumbnail = getAngleThumbnailUrl(angle);
          const isPaused = pausedIndices.has(index);
          const isMuted = mutedIndices.has(index);
          const isMaster = index === masterIndex;
          const isMainLayout = index === 0 && layout === "main-sub";
          const rowSpan = isMainLayout ? (angles.length <= 3 ? "sm:row-span-2" : "sm:row-span-3") : "";
          // Mobile: show only the active angle; Desktop: show all
          const mobileHidden = index !== mobileActiveIndex ? "hidden sm:block" : "";

          return (
            <div
              key={angle.id}
              className={`relative group/cell ${rowSpan} ${mobileHidden}`}
            >
              <VideoPlayer
                ref={(el) => { playerRefs.current[index] = el; }}
                hlsUrl={hlsUrl}
                fallbackUrl={fallbackUrl}
                poster={thumbnail}
                onTimeUpdate={isMaster ? handleTimeUpdate : undefined}
                hideControls
                defaultMuted={!isMaster}
                subtitleUrl={angle.subtitleUrl}
                subtitlesEnabled={subtitlesEnabled}
                className={isMainLayout ? "w-full h-full object-contain rounded-none" : "aspect-video rounded-none"}
              />
              {/* Exercise overlay on first video (all layouts) */}
              {index === 0 && exercises && exercises.length > 0 && (
                <ExerciseOverlay exercises={exercises} currentTime={masterTime} onSeek={masterSeekTo} />
              )}
              {/* Angle label + master badge + sync indicator */}
              <div className="absolute top-1.5 left-1.5 flex items-center gap-1.5 pointer-events-none">
                <div className={`text-white text-xs sm:text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  isMaster ? "bg-primary/80" : "bg-black/70"
                }`}>
                  {angle.label}
                  {isMaster && <span className="ml-1 opacity-70">MAIN</span>}
                </div>
                {!isMaster && syncEnabled && (() => {
                  const drift = drifts[index] ?? 0;
                  if (isPaused) return (
                    <div className="bg-black/70 text-zinc-500 text-xs sm:text-[10px] px-1.5 py-0.5 rounded font-mono">
                      停止中
                    </div>
                  );
                  const absDrift = Math.abs(drift);
                  const color = absDrift < 0.1 ? "text-emerald-400" : absDrift < 0.3 ? "text-amber-400" : "text-red-400";
                  const dotColor = absDrift < 0.1 ? "bg-emerald-400" : absDrift < 0.3 ? "bg-amber-400" : "bg-red-400";
                  return (
                    <div className={`bg-black/70 text-xs sm:text-[10px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1 ${color}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      {absDrift < 0.1 ? "SYNC" : `${drift > 0 ? "+" : ""}${drift.toFixed(2)}s`}
                    </div>
                  );
                })()}
              </div>
              {/* Individual controls overlay */}
              <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover/cell:opacity-100 transition-opacity">
                <button
                  className={`h-8 w-8 sm:h-6 sm:w-6 rounded flex items-center justify-center text-white transition-colors ${
                    isPaused ? "bg-primary/80" : "bg-black/60 hover:bg-black/80"
                  }`}
                  onClick={(e) => { e.stopPropagation(); toggleIndividualPause(index); }}
                  title={isPaused ? "再開" : "一時停止"}
                >
                  {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                </button>
                <button
                  className={`h-8 w-8 sm:h-6 sm:w-6 rounded flex items-center justify-center text-white transition-colors ${
                    isMuted ? "bg-black/60 hover:bg-black/80" : "bg-primary/80"
                  }`}
                  onClick={(e) => { e.stopPropagation(); toggleIndividualMute(index); }}
                  title={isMuted ? "ミュート解除" : "ミュート"}
                >
                  {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                </button>
              </div>
              {/* Paused indicator */}
              {isPaused && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                  <Pause className="h-8 w-8 text-white/60" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: angle tab switcher */}
      {angles.length > 1 && (
        <div className="flex sm:hidden gap-1.5 px-3 py-2 bg-zinc-950 overflow-x-auto scrollbar-none">
          {angles.slice(0, 4).map((angle, index) => {
            const isMaster = index === masterIndex;
            const isActive = index === mobileActiveIndex;
            return (
              <button
                key={angle.id}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "bg-zinc-800 text-zinc-400 active:bg-zinc-700"
                }`}
                onClick={() => setMobileActiveIndex(index)}
              >
                {angle.label}
                {isMaster && <span className="ml-1 text-xs opacity-60">MAIN</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Master Controls */}
      <div className="px-3 pb-2.5 pt-2 bg-zinc-950 border-t border-zinc-800/60">
        <Slider
          value={[masterTime]}
          max={masterDuration || 100}
          step={0.1}
          onValueChange={masterSeek}
          className="mb-2 cursor-pointer [&_[role=slider]]:h-6 [&_[role=slider]]:w-6 sm:[&_[role=slider]]:h-4 sm:[&_[role=slider]]:w-4"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={() => masterSkip(-10)}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9 text-white hover:bg-white/20" onClick={masterTogglePlay}>
              {masterPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={() => masterSkip(10)}>
              <SkipForward className="h-4 w-4" />
            </Button>
            <span className="text-sm sm:text-xs text-white/70 ml-2 tabular-nums whitespace-nowrap font-mono tracking-tight">
              {formatTime(masterTime)} / {formatTime(masterDuration)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Sync toggle button */}
            <button
              className={`h-10 px-4 sm:h-8 sm:px-3 rounded-md text-sm sm:text-xs font-medium flex items-center gap-1.5 transition-colors ${
                syncEnabled
                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                  : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 border border-zinc-700"
              }`}
              onClick={toggleSync}
              title={syncEnabled ? "同期を解除" : "全アングルをメインに同期"}
            >
              <Link2 className="h-3.5 w-3.5" />
              {syncEnabled ? "同期中" : "同期OFF"}
              {syncEnabled && syncStatus && (
                <span className={`ml-1 w-1.5 h-1.5 rounded-full ${
                  syncStatus.allSynced ? "bg-emerald-400" : "bg-amber-400"
                }`} />
              )}
            </button>
            <div className="relative">
              <button
                className="h-10 sm:h-8 px-2 text-sm sm:text-xs text-white/70 hover:text-white hover:bg-white/15 rounded font-mono tabular-nums min-w-[44px] sm:min-w-[36px] text-center"
                onClick={() => setShowRateMenu(!showRateMenu)}
              >
                {playbackRate}x
              </button>
              {showRateMenu && (
                <div className="absolute bottom-full right-0 mb-1.5 bg-zinc-900 border border-zinc-700/60 rounded-lg py-1 min-w-[80px] shadow-xl z-10">
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      className={`block w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-white/10 ${
                        playbackRate === rate ? "text-red-400 font-semibold" : "text-white/80"
                      }`}
                      onClick={() => masterRateChange(rate)}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={masterFullscreen}>
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

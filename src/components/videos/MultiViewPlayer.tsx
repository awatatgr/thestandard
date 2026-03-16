import { useRef, useCallback, useEffect, useState } from "react";
import { VideoPlayer, type VideoPlayerHandle } from "./VideoPlayer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getAngleSrc, getAngleThumbnailUrl, type VideoAngle } from "@/data/videos";
import {
  Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward,
} from "lucide-react";

export type MultiViewLayout = "main-sub" | "equal";

interface MultiViewPlayerProps {
  angles: VideoAngle[];
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  layout?: MultiViewLayout;
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

export function MultiViewPlayer({ angles, onTimeUpdate, layout = "main-sub" }: MultiViewPlayerProps) {
  const playerRefs = useRef<(VideoPlayerHandle | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [masterPlaying, setMasterPlaying] = useState(false);
  const [masterTime, setMasterTime] = useState(0);
  const [masterDuration, setMasterDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showRateMenu, setShowRateMenu] = useState(false);
  const [pausedIndices, setPausedIndices] = useState<Set<number>>(new Set());
  const [mutedIndices, setMutedIndices] = useState<Set<number>>(() => {
    // Default: all muted except first (main)
    const s = new Set<number>();
    for (let i = 1; i < angles.length; i++) s.add(i);
    return s;
  });
  const isSyncing = useRef(false);
  // Per-player drift from master (in seconds)
  const [drifts, setDrifts] = useState<number[]>(() => angles.map(() => 0));

  // Use first player as time source
  const handleTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      setMasterTime(currentTime);
      setMasterDuration(duration);
      onTimeUpdate?.(currentTime, duration);

      // Measure drift & sync other players
      const newDrifts = [0]; // master is always 0
      playerRefs.current.forEach((ref, i) => {
        if (i === 0 || !ref) { if (i > 0) newDrifts.push(0); return; }
        if (pausedIndices.has(i)) { newDrifts.push(NaN); return; }
        const t = ref.getCurrentTime();
        const drift = t - currentTime;
        newDrifts.push(drift);
        if (!isSyncing.current && Math.abs(drift) > 0.5) {
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
    [onTimeUpdate, pausedIndices],
  );

  // Master play/pause
  const masterTogglePlay = useCallback(() => {
    const primary = playerRefs.current[0]?.getVideoElement();
    if (!primary) return;
    if (primary.paused) {
      // Play all (including individually paused ones)
      playerRefs.current.forEach((ref, i) => {
        if (!ref) return;
        const el = ref.getVideoElement();
        if (!el) return;
        // Sync time before resuming
        if (i > 0) el.currentTime = primary.currentTime;
        el.play();
      });
      setPausedIndices(new Set());
      setMasterPlaying(true);
    } else {
      playerRefs.current.forEach((ref) => ref?.pause());
      setMasterPlaying(false);
    }
  }, []);

  // Master seek
  const masterSeek = useCallback((value: number[]) => {
    const time = value[0];
    playerRefs.current.forEach((ref) => {
      const el = ref?.getVideoElement();
      if (el) el.currentTime = time;
    });
    setMasterTime(time);
  }, []);

  // Master skip
  const masterSkip = useCallback((seconds: number) => {
    const primary = playerRefs.current[0]?.getVideoElement();
    if (!primary) return;
    const newTime = Math.max(0, Math.min(primary.duration, primary.currentTime + seconds));
    playerRefs.current.forEach((ref) => {
      const el = ref?.getVideoElement();
      if (el) el.currentTime = newTime;
    });
  }, []);

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
        // Resume from current master time
        const primary = playerRefs.current[0]?.getVideoElement();
        const el = ref.getVideoElement();
        if (el && primary) {
          el.currentTime = primary.currentTime;
          if (!primary.paused) el.play();
        }
      } else {
        next.add(index);
        ref.pause();
      }
      return next;
    });
  }, []);

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

  // Sync play/pause from primary
  useEffect(() => {
    const primary = playerRefs.current[0]?.getVideoElement();
    if (!primary) return;
    const onPlay = () => setMasterPlaying(true);
    const onPause = () => setMasterPlaying(false);
    primary.addEventListener("play", onPlay);
    primary.addEventListener("pause", onPause);
    return () => {
      primary.removeEventListener("play", onPlay);
      primary.removeEventListener("pause", onPause);
    };
  }, [angles]);

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

  return (
    <div ref={containerRef} className="bg-black" tabIndex={0}>
      {/* Grid: layout-dependent */}
      <div
        className={`grid gap-0.5 ${
          layout === "equal"
            ? angles.length <= 2 ? "grid-cols-2" : angles.length === 3 ? "grid-cols-3" : "grid-cols-2"
            : ""
        }`}
        style={layout === "main-sub" ? { gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr 1fr' } : undefined}
      >
        {angles.slice(0, 4).map((angle, index) => {
          const { hlsUrl, fallbackUrl } = getAngleSrc(angle);
          const thumbnail = getAngleThumbnailUrl(angle);
          const isPaused = pausedIndices.has(index);
          const isMuted = mutedIndices.has(index);
          const isMain = index === 0 && layout === "main-sub";

          return (
            <div
              key={angle.id}
              className={`relative group/cell ${isMain ? "row-span-3" : ""}`}
            >
              <VideoPlayer
                ref={(el) => { playerRefs.current[index] = el; }}
                hlsUrl={hlsUrl}
                fallbackUrl={fallbackUrl}
                poster={thumbnail}
                onTimeUpdate={index === 0 ? handleTimeUpdate : undefined}
                hideControls
                defaultMuted={index !== 0}
                className={isMain ? "w-full h-full object-contain rounded-none" : "aspect-video rounded-none"}
              />
              {/* Angle label + sync indicator */}
              <div className="absolute top-1.5 left-1.5 flex items-center gap-1.5 pointer-events-none">
                <div className="bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  {angle.label}
                </div>
                {index > 0 && (() => {
                  const drift = drifts[index] ?? 0;
                  if (isPaused) return (
                    <div className="bg-black/70 text-zinc-500 text-[10px] px-1.5 py-0.5 rounded font-mono">
                      停止中
                    </div>
                  );
                  const absDrift = Math.abs(drift);
                  const color = absDrift < 0.1 ? "text-emerald-400" : absDrift < 0.3 ? "text-amber-400" : "text-red-400";
                  const dotColor = absDrift < 0.1 ? "bg-emerald-400" : absDrift < 0.3 ? "bg-amber-400" : "bg-red-400";
                  return (
                    <div className={`bg-black/70 text-[10px] px-1.5 py-0.5 rounded font-mono flex items-center gap-1 ${color}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      {absDrift < 0.1 ? "SYNC" : `${drift > 0 ? "+" : ""}${drift.toFixed(2)}s`}
                    </div>
                  );
                })()}
              </div>
              {/* Individual controls overlay */}
              <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                <button
                  className={`h-6 w-6 rounded flex items-center justify-center text-white transition-colors ${
                    isPaused ? "bg-primary/80" : "bg-black/60 hover:bg-black/80"
                  }`}
                  onClick={(e) => { e.stopPropagation(); toggleIndividualPause(index); }}
                  title={isPaused ? "再開" : "一時停止"}
                >
                  {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                </button>
                <button
                  className={`h-6 w-6 rounded flex items-center justify-center text-white transition-colors ${
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

      {/* Master Controls */}
      <div className="px-3 pb-2.5 pt-2 bg-zinc-950 border-t border-zinc-800/60">
        <Slider
          value={[masterTime]}
          max={masterDuration || 100}
          step={0.1}
          onValueChange={masterSeek}
          className="mb-2 cursor-pointer [&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={() => masterSkip(-10)}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20" onClick={masterTogglePlay}>
              {masterPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={() => masterSkip(10)}>
              <SkipForward className="h-4 w-4" />
            </Button>
            <span className="text-xs text-white/70 ml-2 tabular-nums whitespace-nowrap font-mono tracking-tight">
              {formatTime(masterTime)} / {formatTime(masterDuration)}
            </span>
            {/* Overall sync status */}
            {(() => {
              const activeDrifts = drifts.slice(1).filter((d) => !isNaN(d));
              if (activeDrifts.length === 0) return null;
              const maxDrift = Math.max(...activeDrifts.map(Math.abs));
              const allSynced = maxDrift < 0.1;
              const someOff = maxDrift >= 0.3;
              return (
                <span className={`ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  allSynced ? "bg-emerald-500/20 text-emerald-400" :
                  someOff ? "bg-red-500/20 text-red-400" :
                  "bg-amber-500/20 text-amber-400"
                }`}>
                  {allSynced ? "SYNCED" : someOff ? `MAX ${maxDrift.toFixed(2)}s` : `~${maxDrift.toFixed(2)}s`}
                </span>
              );
            })()}
          </div>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/15 rounded font-mono tabular-nums min-w-[36px] text-center"
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
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/15" onClick={masterFullscreen}>
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

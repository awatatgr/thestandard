import { useMemo } from "react";
import type { ExerciseChapter } from "@/data/videos";

interface ExerciseOverlayProps {
  exercises: ExerciseChapter[];
  currentTime: number;
  onSeek?: (seconds: number) => void;
}

export function ExerciseOverlay({ exercises, currentTime, onSeek }: ExerciseOverlayProps) {
  const current = useMemo(() => {
    const idx = exercises.findIndex(
      (ex) => currentTime >= ex.startSeconds && currentTime < ex.endSeconds,
    );
    return idx >= 0 ? { index: idx, exercise: exercises[idx] } : null;
  }, [exercises, currentTime]);

  if (!current) return null;

  const interactive = !!onSeek;

  return (
    <div className={`absolute inset-0 z-10 ${interactive ? "" : "pointer-events-none"}`}>
      {/* Top bar: exercise name + progress badge */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent px-4 pt-3 pb-10 pointer-events-none">
        <div className="flex items-start justify-between gap-3">
          <div key={current.index} className="animate-fade-in">
            <p className="text-white text-lg sm:text-xl font-bold drop-shadow-lg leading-tight">
              {current.exercise.name}
            </p>
          </div>
          <div className="shrink-0 bg-primary/90 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
            <span className="text-white text-sm font-black">{current.index + 1}</span>
            <span className="text-white/60 text-xs font-medium">/</span>
            <span className="text-white/80 text-sm font-bold">{exercises.length}</span>
          </div>
        </div>
      </div>

      {/* Bottom progress bar — clickable dots */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center items-end gap-0.5 sm:gap-1 px-3">
        {exercises.map((ex, i) => {
          const isActive = i === current.index;
          const isDone = i < current.index;
          return (
            <button
              key={i}
              type="button"
              className={`flex flex-col items-center gap-0.5 group ${
                interactive ? "cursor-pointer" : "cursor-default pointer-events-none"
              }`}
              onClick={interactive ? () => onSeek(ex.startSeconds) : undefined}
              title={ex.name}
            >
              {isActive && (
                <span className="text-[9px] text-primary font-bold animate-fade-in">{i + 1}</span>
              )}
              {!isActive && interactive && (
                <span className="text-[8px] text-white/0 group-hover:text-white/70 font-medium transition-colors truncate max-w-[60px]">
                  {ex.name}
                </span>
              )}
              <div
                className={`rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-5 h-2.5 bg-primary shadow-lg shadow-primary/40"
                    : isDone
                      ? `w-2.5 h-2.5 bg-white/50 ${interactive ? "group-hover:bg-white/80 group-hover:scale-125" : ""}`
                      : `w-2.5 h-2.5 bg-white/20 ${interactive ? "group-hover:bg-white/50 group-hover:scale-125" : ""}`
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

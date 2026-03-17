import { useMemo } from "react";
import type { ExerciseChapter } from "@/data/videos";

interface ExerciseOverlayProps {
  exercises: ExerciseChapter[];
  currentTime: number;
}

export function ExerciseOverlay({ exercises, currentTime }: ExerciseOverlayProps) {
  const current = useMemo(() => {
    const idx = exercises.findIndex(
      (ex) => currentTime >= ex.startSeconds && currentTime < ex.endSeconds,
    );
    return idx >= 0 ? { index: idx, exercise: exercises[idx] } : null;
  }, [exercises, currentTime]);

  if (!current) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top bar: exercise name + progress badge */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent px-4 pt-3 pb-10">
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

      {/* Bottom progress bar with numbers */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center items-end gap-0.5 sm:gap-1 px-3">
        {exercises.map((_, i) => {
          const isActive = i === current.index;
          const isDone = i < current.index;
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              {isActive && (
                <span className="text-[9px] text-primary font-bold animate-fade-in">{i + 1}</span>
              )}
              <div
                className={`rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-5 h-2.5 bg-primary shadow-lg shadow-primary/40"
                    : isDone
                      ? "w-2.5 h-2.5 bg-white/50"
                      : "w-2.5 h-2.5 bg-white/20"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

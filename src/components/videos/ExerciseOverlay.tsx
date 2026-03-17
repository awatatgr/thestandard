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
      {/* Top bar: exercise name + progress */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent px-4 pt-3 pb-8">
        <div className="flex items-start justify-between gap-3">
          <div className="animate-fade-in">
            <p className="text-white text-base sm:text-lg font-bold drop-shadow-lg leading-tight">
              {current.exercise.name}
            </p>
          </div>
          <div className="shrink-0 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5">
            <span className="text-primary text-xs font-bold">{current.index + 1}</span>
            <span className="text-zinc-500 text-[10px]">/</span>
            <span className="text-zinc-400 text-xs">{exercises.length}</span>
          </div>
        </div>
      </div>

      {/* Bottom progress dots */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 px-4">
        {exercises.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === current.index
                ? "w-4 bg-primary"
                : i < current.index
                  ? "w-1.5 bg-white/40"
                  : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

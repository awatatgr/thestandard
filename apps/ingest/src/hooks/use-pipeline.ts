import { useReducer, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { DetectedVolume, PipelineProgress } from "@/lib/types";

interface PipelineState {
  step: "idle" | "detecting" | "configuring" | "running" | "complete" | "failed";
  drives: DetectedVolume[];
  pipelineId: string | null;
  progress: Record<string, { step: string; pct: number; message: string }>;
  errors: string[];
  result: { success: number; errors: number } | null;
}

type Action =
  | { type: "SET_STEP"; step: PipelineState["step"] }
  | { type: "SET_DRIVES"; drives: DetectedVolume[] }
  | { type: "SET_PIPELINE_ID"; id: string }
  | { type: "PROGRESS"; payload: PipelineProgress }
  | { type: "ERROR"; message: string }
  | { type: "COMPLETE"; success: number; errors: number }
  | { type: "RESET" };

function reducer(state: PipelineState, action: Action): PipelineState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step };
    case "SET_DRIVES":
      return { ...state, drives: action.drives, step: "configuring" };
    case "SET_PIPELINE_ID":
      return { ...state, pipelineId: action.id, step: "running", progress: {}, errors: [] };
    case "PROGRESS":
      return {
        ...state,
        progress: {
          ...state.progress,
          [action.payload.file_path]: {
            step: action.payload.step,
            pct: action.payload.progress_pct,
            message: action.payload.message,
          },
        },
      };
    case "ERROR":
      return { ...state, errors: [...state.errors, action.message] };
    case "COMPLETE":
      return {
        ...state,
        step: action.errors > 0 ? "failed" : "complete",
        result: { success: action.success, errors: action.errors },
      };
    case "RESET":
      return initialState;
  }
}

const initialState: PipelineState = {
  step: "idle",
  drives: [],
  pipelineId: null,
  progress: {},
  errors: [],
  result: null,
};

export function usePipeline() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const unlisteners: Promise<() => void>[] = [];

    unlisteners.push(
      listen<PipelineProgress>("pipeline:progress", (e) => {
        dispatch({ type: "PROGRESS", payload: e.payload });
      }),
    );
    unlisteners.push(
      listen<{ pipeline_id: string; file_path: string; error: string }>(
        "pipeline:error",
        (e) => {
          dispatch({ type: "ERROR", message: `${e.payload.file_path}: ${e.payload.error}` });
        },
      ),
    );
    unlisteners.push(
      listen<{ pipeline_id: string; success_count: number; error_count: number }>(
        "pipeline:complete",
        (e) => {
          dispatch({ type: "COMPLETE", success: e.payload.success_count, errors: e.payload.error_count });
        },
      ),
    );

    return () => {
      unlisteners.forEach((p) => p.then((fn_) => fn_()));
    };
  }, []);

  const detectDrives = useCallback(async () => {
    dispatch({ type: "SET_STEP", step: "detecting" });
    try {
      const drives = await invoke<DetectedVolume[]>("scan_volumes");
      dispatch({ type: "SET_DRIVES", drives });
    } catch (e) {
      dispatch({ type: "ERROR", message: String(e) });
      dispatch({ type: "SET_STEP", step: "idle" });
    }
  }, []);

  const startPipeline = useCallback(
    async (request: {
      files: { source_path: string; camera_id: string; camera_label: string }[];
      video_id: string;
      video_title: string;
      video_category: string;
    }) => {
      try {
        const id = await invoke<string>("start_pipeline", { request });
        dispatch({ type: "SET_PIPELINE_ID", id });
      } catch (e) {
        dispatch({ type: "ERROR", message: String(e) });
      }
    },
    [],
  );

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, detectDrives, startPipeline, reset };
}

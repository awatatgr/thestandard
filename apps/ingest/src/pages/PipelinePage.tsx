import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { usePipeline } from "@/hooks/use-pipeline";
import type { FileClassification, VideoFileInfo } from "@/lib/types";
import {
  HardDrive,
  Play,
  RotateCcw,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  AlertCircle,
  LayoutGrid,
  LayoutList,
  ChevronRight,
  ChevronDown,
  Clock,
  Calendar,
  Film,
} from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return iso;
  }
}

/** Thumbnail with lazy loading via get_thumbnail command */
function Thumbnail({ path }: { path: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    invoke<string>("get_thumbnail", { path })
      .then((b64) => {
        if (!cancelled) setSrc(`data:image/jpeg;base64,${b64}`);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (loading) {
    return (
      <div className="w-full aspect-video bg-muted rounded flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (failed || !src) {
    return (
      <div className="w-full aspect-video bg-muted rounded flex items-center justify-center">
        <Film className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }
  return <img src={src} className="w-full aspect-video object-cover rounded" alt="" />;
}

interface SelectedFile {
  source_path: string;
  camera_id: string;
  camera_label: string;
  // metadata for display
  size_bytes: number;
  duration_secs: number | null;
  created_at: string | null;
  relative_dir: string;
}

export function PipelinePage() {
  const { state, detectDrives, startPipeline, reset } = usePipeline();
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [videoId, setVideoId] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoCategory, setVideoCategory] = useState("training");
  const [classifying, setClassifying] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [collapsedDirs, setCollapsedDirs] = useState<Set<string>>(new Set());

  const toggleDir = useCallback((dir: string) => {
    setCollapsedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(dir)) next.delete(dir);
      else next.add(dir);
      return next;
    });
  }, []);

  const handleScanAndClassify = async (volumePath: string) => {
    setClassifying(true);
    try {
      const files = await invoke<VideoFileInfo[]>("list_video_files", { volumePath });
      const paths = files.map((f) => f.path);
      const classifications = await invoke<FileClassification[]>("classify_files", { paths });

      // Merge file info with classification
      const classMap = new Map(classifications.map((c) => [c.path, c]));
      const mapped: SelectedFile[] = files.map((f) => {
        const cls = classMap.get(f.path);
        return {
          source_path: f.path,
          camera_id: cls?.camera_id ?? "unknown",
          camera_label: cls?.camera_id ? "" : "不明",
          size_bytes: f.size_bytes,
          duration_secs: f.duration_secs,
          created_at: f.created_at,
          relative_dir: f.relative_dir,
        };
      });
      setSelectedFiles((prev) => [...prev, ...mapped]);
    } catch (e) {
      console.error(e);
    } finally {
      setClassifying(false);
    }
  };

  const handleStart = () => {
    if (!videoId || !videoTitle || selectedFiles.length === 0) return;
    startPipeline({
      files: selectedFiles.map((f) => ({
        source_path: f.source_path,
        camera_id: f.camera_id,
        camera_label: f.camera_label,
      })),
      video_id: videoId,
      video_title: videoTitle,
      video_category: videoCategory,
    });
  };

  // Group files by relative_dir
  const groupedFiles = selectedFiles.reduce<Record<string, SelectedFile[]>>((acc, f) => {
    const dir = f.relative_dir || "(ルート)";
    (acc[dir] ??= []).push(f);
    return acc;
  }, {});
  const sortedDirs = Object.keys(groupedFiles).sort();

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-lg font-semibold mb-6">パイプライン</h2>

      {/* Idle / Detect */}
      {state.step === "idle" && (
        <div className="text-center py-16">
          <HardDrive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            SSD/HDD を接続して「検出」を押してください
          </p>
          <button
            onClick={detectDrives}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm flex items-center gap-2 mx-auto"
          >
            <Search className="h-4 w-4" />
            ドライブを検出
          </button>
        </div>
      )}

      {/* Detecting */}
      {state.step === "detecting" && (
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">ドライブを検出中...</p>
        </div>
      )}

      {/* Configuring - show drives & files */}
      {state.step === "configuring" && (
        <div className="space-y-6">
          {/* Detected drives */}
          <section>
            <h3 className="text-sm font-medium mb-3">
              検出されたドライブ ({state.drives.length}台)
            </h3>
            {state.drives.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                外付けドライブが見つかりません
              </p>
            ) : (
              <div className="space-y-2">
                {state.drives.map((drive) => (
                  <div
                    key={drive.path}
                    className="flex items-center justify-between p-3 rounded-md border border-border"
                  >
                    <div>
                      <div className="text-sm font-medium">{drive.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {drive.video_count} 動画 ・ {formatBytes(drive.total_size_bytes)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleScanAndClassify(drive.path)}
                      disabled={classifying}
                      className="px-3 py-1.5 rounded-md border border-input text-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {classifying ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Search className="h-3.5 w-3.5" />
                      )}
                      スキャン
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Classified files with folder grouping */}
          {selectedFiles.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">
                  ファイル ({selectedFiles.length}本)
                </h3>
                <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1 rounded ${viewMode === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
                    title="リスト表示"
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1 rounded ${viewMode === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
                    title="グリッド表示"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-auto space-y-1">
                {sortedDirs.map((dir) => {
                  const dirFiles = groupedFiles[dir];
                  const isCollapsed = collapsedDirs.has(dir);

                  return (
                    <div key={dir}>
                      {/* Folder header */}
                      <button
                        onClick={() => toggleDir(dir)}
                        className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                        <span>{dir}</span>
                        <span className="text-muted-foreground/60 ml-1">
                          ({dirFiles.length})
                        </span>
                      </button>

                      {/* File list or grid */}
                      {!isCollapsed && (
                        viewMode === "list" ? (
                          <div className="space-y-0.5 ml-4">
                            {dirFiles.map((f, i) => {
                              const globalIdx = selectedFiles.indexOf(f);
                              return (
                                <div
                                  key={i}
                                  className="flex items-center gap-3 px-3 py-1.5 text-xs rounded border border-border"
                                >
                                  <span className="truncate flex-1 font-mono">
                                    {f.source_path.split("/").pop()}
                                  </span>
                                  {f.duration_secs != null && (
                                    <span className="flex items-center gap-1 text-muted-foreground shrink-0">
                                      <Clock className="h-3 w-3" />
                                      {formatDuration(f.duration_secs)}
                                    </span>
                                  )}
                                  {f.created_at && (
                                    <span className="flex items-center gap-1 text-muted-foreground shrink-0">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(f.created_at)}
                                    </span>
                                  )}
                                  <span className="text-muted-foreground shrink-0">
                                    {formatBytes(f.size_bytes)}
                                  </span>
                                  <select
                                    value={f.camera_id}
                                    onChange={(e) => {
                                      const updated = [...selectedFiles];
                                      updated[globalIdx] = { ...f, camera_id: e.target.value };
                                      setSelectedFiles(updated);
                                    }}
                                    className="px-2 py-0.5 rounded border border-input bg-background text-xs shrink-0"
                                  >
                                    <option value="front">正面</option>
                                    <option value="side">側面</option>
                                    <option value="top">俯瞰</option>
                                    <option value="back">背面</option>
                                    <option value="unknown">不明</option>
                                  </select>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 ml-4">
                            {dirFiles.map((f, i) => {
                              const globalIdx = selectedFiles.indexOf(f);
                              return (
                                <div
                                  key={i}
                                  className="rounded-md border border-border overflow-hidden"
                                >
                                  <Thumbnail path={f.source_path} />
                                  <div className="p-2 space-y-1">
                                    <div className="text-xs font-mono truncate">
                                      {f.source_path.split("/").pop()}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                      {f.duration_secs != null && (
                                        <span>{formatDuration(f.duration_secs)}</span>
                                      )}
                                      <span>{formatBytes(f.size_bytes)}</span>
                                      {f.created_at && (
                                        <span>{formatDate(f.created_at)}</span>
                                      )}
                                    </div>
                                    <select
                                      value={f.camera_id}
                                      onChange={(e) => {
                                        const updated = [...selectedFiles];
                                        updated[globalIdx] = { ...f, camera_id: e.target.value };
                                        setSelectedFiles(updated);
                                      }}
                                      className="w-full px-1.5 py-0.5 rounded border border-input bg-background text-xs"
                                    >
                                      <option value="front">正面</option>
                                      <option value="side">側面</option>
                                      <option value="top">俯瞰</option>
                                      <option value="back">背面</option>
                                      <option value="unknown">不明</option>
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Video metadata */}
          {selectedFiles.length > 0 && (
            <section>
              <h3 className="text-sm font-medium mb-3">動画メタデータ</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Video ID
                  </label>
                  <input
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    value={videoId}
                    onChange={(e) => setVideoId(e.target.value)}
                    placeholder="session-2026-03-19"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    タイトル
                  </label>
                  <input
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="トレーニングセッション"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    カテゴリ
                  </label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    value={videoCategory}
                    onChange={(e) => setVideoCategory(e.target.value)}
                  >
                    <option value="training">training</option>
                    <option value="drill">drill</option>
                    <option value="method">method</option>
                    <option value="interview">interview</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* Start button */}
          <div className="flex gap-2">
            <button
              onClick={handleStart}
              disabled={!videoId || !videoTitle || selectedFiles.length === 0}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              パイプライン開始
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-md border border-input text-sm"
            >
              リセット
            </button>
          </div>
        </div>
      )}

      {/* Running */}
      {state.step === "running" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">パイプライン実行中...</span>
          </div>

          {Object.entries(state.progress).map(([path, info]) => (
            <div key={path} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="truncate">{path.split("/").pop()}</span>
                <span className="text-muted-foreground">{info.message}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${info.pct}%` }}
                />
              </div>
            </div>
          ))}

          {state.errors.length > 0 && (
            <div className="space-y-1 mt-4">
              {state.errors.map((err, i) => (
                <div key={i} className="text-xs text-red-400 flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {err}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Complete */}
      {state.step === "complete" && (
        <div className="text-center py-16">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">完了</p>
          <p className="text-sm text-muted-foreground mb-6">
            {state.result?.success}本の動画を処理しました
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-md border border-input text-sm flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="h-4 w-4" />
            新しいセッション
          </button>
        </div>
      )}

      {/* Failed */}
      {state.step === "failed" && (
        <div className="text-center py-16">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">エラーが発生しました</p>
          <p className="text-sm text-muted-foreground mb-4">
            {state.result?.success}本成功、{state.result?.errors}本失敗
          </p>
          {state.errors.map((err, i) => (
            <p key={i} className="text-xs text-red-400 mb-1">{err}</p>
          ))}
          <button
            onClick={reset}
            className="mt-6 px-4 py-2 rounded-md border border-input text-sm flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="h-4 w-4" />
            リトライ
          </button>
        </div>
      )}
    </div>
  );
}

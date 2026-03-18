import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { usePipeline } from "@/hooks/use-pipeline";
import type { FileClassification } from "@/lib/types";
import {
  HardDrive,
  Play,
  RotateCcw,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  AlertCircle,
} from "lucide-react";

export function PipelinePage() {
  const { state, detectDrives, startPipeline, reset } = usePipeline();
  const [selectedFiles, setSelectedFiles] = useState<
    { source_path: string; camera_id: string; camera_label: string }[]
  >([]);
  const [videoId, setVideoId] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoCategory, setVideoCategory] = useState("training");
  const [classifying, setClassifying] = useState(false);

  const handleScanAndClassify = async (volumePath: string) => {
    setClassifying(true);
    try {
      const files = await invoke<{ path: string; name: string; size_bytes: number }[]>(
        "list_video_files",
        { volumePath },
      );
      const paths = files.map((f) => f.path);
      const classifications = await invoke<FileClassification[]>("classify_files", {
        paths,
      });
      const mapped = classifications.map((c) => ({
        source_path: c.path,
        camera_id: c.camera_id ?? "unknown",
        camera_label: c.camera_label ?? "不明",
      }));
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
      files: selectedFiles,
      video_id: videoId,
      video_title: videoTitle,
      video_category: videoCategory,
    });
  };

  return (
    <div className="p-6 max-w-3xl">
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
                        {drive.video_count} 動画 ・{" "}
                        {(drive.total_size_bytes / 1024 / 1024 / 1024).toFixed(1)} GB
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

          {/* Classified files */}
          {selectedFiles.length > 0 && (
            <section>
              <h3 className="text-sm font-medium mb-3">
                ファイル ({selectedFiles.length}本)
              </h3>
              <div className="space-y-1 max-h-48 overflow-auto">
                {selectedFiles.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-1.5 text-xs rounded border border-border"
                  >
                    <span className="truncate flex-1">
                      {f.source_path.split("/").pop()}
                    </span>
                    <select
                      value={f.camera_id}
                      onChange={(e) => {
                        const updated = [...selectedFiles];
                        updated[i] = { ...f, camera_id: e.target.value };
                        setSelectedFiles(updated);
                      }}
                      className="ml-2 px-2 py-0.5 rounded border border-input bg-background text-xs"
                    >
                      <option value="front">正面</option>
                      <option value="side">側面</option>
                      <option value="top">俯瞰</option>
                      <option value="back">背面</option>
                      <option value="unknown">不明</option>
                    </select>
                  </div>
                ))}
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

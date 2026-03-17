import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  type ApiVideo,
  type VideoInput,
} from "@/lib/api";
import { videos as staticVideos, VIDEO_CATEGORIES, type Video, type VideoCategoryKey } from "@/data/videos";
import { ArrowLeft, Plus, Trash2, Copy, Pencil, Check, X, GripVertical } from "lucide-react";

// --- Types ---

interface VideoFormData {
  id: string;
  title: string;
  description: string;
  category: string;
  chapter: string;
  durationSeconds: string;
  recordedAt: string;
  angles: { id: string; label: string; bunnyStreamId: string; subtitleUrl: string }[];
  exercises: { name: string; startSeconds: string; endSeconds: string }[];
}

const EMPTY_FORM: VideoFormData = {
  id: "",
  title: "",
  description: "",
  category: "training",
  chapter: "",
  durationSeconds: "",
  recordedAt: "",
  angles: [{ id: "", label: "正面", bunnyStreamId: "", subtitleUrl: "" }],
  exercises: [],
};

const CATEGORIES: { value: string; label: string }[] = Object.entries(VIDEO_CATEGORIES).map(
  ([value, { label }]) => ({ value, label }),
);

// --- Converters ---

function apiToForm(v: ApiVideo): VideoFormData {
  return {
    id: v.id,
    title: v.title,
    description: v.description || "",
    category: v.category,
    chapter: v.chapter || "",
    durationSeconds: v.durationSeconds?.toString() || "",
    recordedAt: v.recordedAt || "",
    angles: v.angles.map((a) => ({
      id: a.id,
      label: a.label,
      bunnyStreamId: a.bunnyStreamId || "",
      subtitleUrl: a.subtitleUrl || "",
    })),
    exercises:
      v.chapters?.map((c) => ({
        name: c.name,
        startSeconds: c.start.toString(),
        endSeconds: c.end.toString(),
      })) || [],
  };
}

function staticToForm(v: Video): VideoFormData {
  return {
    id: v.id,
    title: v.title,
    description: v.description || "",
    category: v.category,
    chapter: v.chapter || "",
    durationSeconds: v.durationSeconds?.toString() || "",
    recordedAt: v.recordedAt || "",
    angles: v.angles.map((a) => ({
      id: a.id,
      label: a.label,
      bunnyStreamId: a.bunnyStreamId || "",
      subtitleUrl: a.subtitleUrl || "",
    })),
    exercises:
      v.exercises?.map((e) => ({
        name: e.name,
        startSeconds: e.startSeconds.toString(),
        endSeconds: e.endSeconds.toString(),
      })) || [],
  };
}

function formToInput(form: VideoFormData): VideoInput {
  return {
    id: form.id,
    title: form.title,
    description: form.description || undefined,
    category: form.category,
    chapter: form.chapter || undefined,
    durationSeconds: form.durationSeconds ? Number(form.durationSeconds) : undefined,
    recordedAt: form.recordedAt || undefined,
    angles: form.angles
      .filter((a) => a.id && a.label)
      .map((a) => ({
        id: a.id,
        label: a.label,
        bunnyStreamId: a.bunnyStreamId || undefined,
        subtitleUrl: a.subtitleUrl || undefined,
      })),
    exercises: form.exercises.length
      ? form.exercises
          .filter((e) => e.name)
          .map((e) => ({
            name: e.name,
            startSeconds: Number(e.startSeconds) || 0,
            endSeconds: Number(e.endSeconds) || 0,
          }))
      : undefined,
  };
}

// --- Shared UI ---

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  disabled,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className || ""}`}>
      <span className="text-xs text-zinc-400 mb-1 block">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
      />
    </label>
  );
}

// --- Main Component ---

export default function AdminPage() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VideoFormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [apiAvailable, setApiAvailable] = useState(true);

  // Show toast with auto-dismiss
  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Load videos
  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchVideos();
      setVideos(data.map(apiToForm));
      setApiAvailable(true);
    } catch {
      setVideos(staticVideos.map(staticToForm));
      setApiAvailable(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // Start editing
  const startEdit = useCallback(
    (videoId: string) => {
      const video = videos.find((v) => v.id === videoId);
      if (!video) return;
      setForm({ ...video, angles: video.angles.map((a) => ({ ...a })), exercises: video.exercises.map((e) => ({ ...e })) });
      setEditingId(videoId);
      setView("edit");
    },
    [videos],
  );

  // Start creating
  const startCreate = useCallback(() => {
    setForm({ ...EMPTY_FORM, angles: [{ id: "", label: "正面", bunnyStreamId: "", subtitleUrl: "" }], exercises: [] });
    setEditingId(null);
    setView("edit");
  }, []);

  // Save (create or update)
  const handleSave = useCallback(async () => {
    if (!form.id || !form.title || form.angles.length === 0) {
      showToast("error", "ID・タイトル・アングルは必須です");
      return;
    }

    setSaving(true);
    try {
      const input = formToInput(form);
      if (editingId) {
        await updateVideo(editingId, input);
        showToast("success", "動画を更新しました");
      } else {
        await createVideo(input);
        showToast("success", "動画を作成しました");
      }
      await loadVideos();
      setView("list");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "保存に失敗しました");
    }
    setSaving(false);
  }, [form, editingId, loadVideos, showToast]);

  // Delete
  const handleDelete = useCallback(
    async (videoId: string) => {
      if (!confirm(`「${videos.find((v) => v.id === videoId)?.title}」を削除しますか？`)) return;
      try {
        await deleteVideo(videoId);
        showToast("success", "動画を削除しました");
        await loadVideos();
      } catch (err) {
        showToast("error", err instanceof Error ? err.message : "削除に失敗しました");
      }
    },
    [videos, loadVideos, showToast],
  );

  // Copy embed URL
  const copyEmbedUrl = useCallback(
    (videoId: string) => {
      const url = `${window.location.origin}/embed/${videoId}`;
      navigator.clipboard.writeText(url).then(
        () => showToast("success", "Embed URLをコピーしました"),
        () => showToast("error", "コピーに失敗しました"),
      );
    },
    [showToast],
  );

  // Copy iframe snippet
  const copyIframe = useCallback(
    (videoId: string) => {
      const url = `${window.location.origin}/embed/${videoId}?layout=equal`;
      const iframe = `<iframe src="${url}" class="w-full aspect-video" allow="fullscreen" frameborder="0"></iframe>`;
      navigator.clipboard.writeText(iframe).then(
        () => showToast("success", "iframeタグをコピーしました"),
        () => showToast("error", "コピーに失敗しました"),
      );
    },
    [showToast],
  );

  // --- Form helpers ---

  function updateForm<K extends keyof VideoFormData>(key: K, value: VideoFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateAngle(index: number, key: string, value: string) {
    setForm((prev) => {
      const angles = [...prev.angles];
      angles[index] = { ...angles[index], [key]: value };
      return { ...prev, angles };
    });
  }

  function addAngle() {
    setForm((prev) => ({
      ...prev,
      angles: [...prev.angles, { id: "", label: "", bunnyStreamId: "", subtitleUrl: "" }],
    }));
  }

  function removeAngle(index: number) {
    setForm((prev) => ({ ...prev, angles: prev.angles.filter((_, i) => i !== index) }));
  }

  function updateExercise(index: number, key: string, value: string) {
    setForm((prev) => {
      const exercises = [...prev.exercises];
      exercises[index] = { ...exercises[index], [key]: value };
      return { ...prev, exercises };
    });
  }

  function addExercise() {
    setForm((prev) => ({
      ...prev,
      exercises: [...prev.exercises, { name: "", startSeconds: "", endSeconds: "" }],
    }));
  }

  function removeExercise(index: number) {
    setForm((prev) => ({ ...prev, exercises: prev.exercises.filter((_, i) => i !== index) }));
  }

  // --- Render ---

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-sm font-bold tracking-wider text-zinc-200">THE STANDARD</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">Admin</span>
          </div>
          {view === "list" && (
            <button
              onClick={startCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              新規動画
            </button>
          )}
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg animate-fade-in ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* API warning */}
      {!apiAvailable && (
        <div className="max-w-6xl mx-auto px-4 pt-3">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2.5 text-sm text-amber-400">
            APIに接続できません。静的データを表示中です。CRUD操作にはwranglerの起動が必要です。
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-zinc-500 text-sm">読み込み中...</div>
          </div>
        ) : view === "list" ? (
          /* ==================== LIST VIEW ==================== */
          <div className="space-y-3">
            <div className="text-xs text-zinc-500 mb-4">{videos.length} 本の動画</div>
            {videos.map((video) => {
              const cat = VIDEO_CATEGORIES[video.category as VideoCategoryKey];
              return (
                <div
                  key={video.id}
                  className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-4 flex items-start gap-4 group hover:border-zinc-700/60 transition-colors"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {cat && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                      )}
                      <span className="text-[10px] text-zinc-600 font-mono">{video.id}</span>
                    </div>
                    <h3 className="text-sm font-medium text-zinc-200 truncate">{video.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-500">
                      <span>{video.angles.length} アングル</span>
                      {video.durationSeconds && <span>{Math.floor(Number(video.durationSeconds) / 60)}分</span>}
                      {video.exercises.length > 0 && <span>{video.exercises.length} チャプター</span>}
                      {video.recordedAt && <span>{video.recordedAt}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyEmbedUrl(video.id)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      title="Embed URLをコピー"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => copyIframe(video.id)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-[10px] font-mono"
                      title="iframeタグをコピー"
                    >
                      {"</>"}
                    </button>
                    <button
                      onClick={() => startEdit(video.id)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors"
                      title="編集"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                      title="削除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ==================== EDIT VIEW ==================== */
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setView("list")}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-semibold text-zinc-200">
                {editingId ? "動画を編集" : "新規動画を追加"}
              </h2>
            </div>

            <div className="space-y-6">
              {/* Basic fields */}
              <section className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">基本情報</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="ID (URL用)"
                    value={form.id}
                    onChange={(v) => updateForm("id", v)}
                    placeholder="inoha-stretch"
                    required
                    disabled={!!editingId}
                  />
                  <div>
                    <span className="text-xs text-zinc-400 mb-1 block">
                      カテゴリ<span className="text-red-400 ml-0.5">*</span>
                    </span>
                    <select
                      value={form.category}
                      onChange={(e) => updateForm("category", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input
                  label="タイトル"
                  value={form.title}
                  onChange={(v) => updateForm("title", v)}
                  placeholder="ストレッチ＆モビリティ — フルセッション"
                  required
                />
                <div>
                  <span className="text-xs text-zinc-400 mb-1 block">説明</span>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    placeholder="動画の説明..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="チャプター名"
                    value={form.chapter}
                    onChange={(v) => updateForm("chapter", v)}
                    placeholder="ストレッチ"
                  />
                  <Input
                    label="再生時間 (秒)"
                    value={form.durationSeconds}
                    onChange={(v) => updateForm("durationSeconds", v)}
                    type="number"
                    placeholder="612"
                  />
                  <Input
                    label="収録日"
                    value={form.recordedAt}
                    onChange={(v) => updateForm("recordedAt", v)}
                    type="date"
                  />
                </div>
              </section>

              {/* Angles */}
              <section className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    アングル ({form.angles.length})
                  </h3>
                  <button
                    onClick={addAngle}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    追加
                  </button>
                </div>
                {form.angles.map((angle, i) => (
                  <div key={i} className="bg-zinc-800/50 rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <GripVertical className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">アングル {i + 1}</span>
                      </div>
                      {form.angles.length > 1 && (
                        <button
                          onClick={() => removeAngle(i)}
                          className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="ID"
                        value={angle.id}
                        onChange={(v) => updateAngle(i, "id", v)}
                        placeholder="inoha-stretch-front"
                        required
                      />
                      <Input
                        label="ラベル"
                        value={angle.label}
                        onChange={(v) => updateAngle(i, "label", v)}
                        placeholder="正面"
                        required
                      />
                    </div>
                    <Input
                      label="Bunny Stream ID"
                      value={angle.bunnyStreamId}
                      onChange={(v) => updateAngle(i, "bunnyStreamId", v)}
                      placeholder="5315b34e-2fb3-4fc3-8149-6d196d2466ff"
                    />
                    <Input
                      label="字幕URL (WebVTT)"
                      value={angle.subtitleUrl}
                      onChange={(v) => updateAngle(i, "subtitleUrl", v)}
                      placeholder="/subs/stretch.vtt"
                    />
                  </div>
                ))}
              </section>

              {/* Exercises / Chapters */}
              <section className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    エクササイズ / チャプター ({form.exercises.length})
                  </h3>
                  <button
                    onClick={addExercise}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    追加
                  </button>
                </div>
                {form.exercises.length === 0 && (
                  <p className="text-xs text-zinc-600 py-2">
                    エクササイズ/チャプターを追加すると、プレイヤーにオーバーレイ表示されます。
                  </p>
                )}
                {form.exercises.map((ex, i) => (
                  <div key={i} className="flex items-end gap-3 bg-zinc-800/50 rounded-lg p-3">
                    <Input
                      label="名前"
                      value={ex.name}
                      onChange={(v) => updateExercise(i, "name", v)}
                      placeholder="長座体前屈"
                      className="flex-1"
                      required
                    />
                    <Input
                      label="開始 (秒)"
                      value={ex.startSeconds}
                      onChange={(v) => updateExercise(i, "startSeconds", v)}
                      type="number"
                      placeholder="0"
                      className="w-24"
                    />
                    <Input
                      label="終了 (秒)"
                      value={ex.endSeconds}
                      onChange={(v) => updateExercise(i, "endSeconds", v)}
                      type="number"
                      placeholder="90"
                      className="w-24"
                    />
                    <button
                      onClick={() => removeExercise(i)}
                      className="p-2 rounded text-zinc-500 hover:text-red-400 transition-colors mb-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </section>

              {/* Embed preview */}
              {form.id && (
                <section className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Embed</h3>
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs text-zinc-500">URL</span>
                      <button
                        onClick={() => copyEmbedUrl(form.id)}
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        コピー
                      </button>
                    </div>
                    <code className="text-xs text-zinc-300 break-all">
                      {window.location.origin}/embed/{form.id}
                    </code>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs text-zinc-500">iframe</span>
                      <button
                        onClick={() => copyIframe(form.id)}
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        コピー
                      </button>
                    </div>
                    <code className="text-xs text-zinc-300 break-all">
                      {`<iframe src="${window.location.origin}/embed/${form.id}?layout=equal" class="w-full aspect-video" allow="fullscreen" frameborder="0"></iframe>`}
                    </code>
                  </div>
                </section>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {saving ? "保存中..." : editingId ? "更新" : "作成"}
                </button>
                <button
                  onClick={() => setView("list")}
                  className="px-5 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

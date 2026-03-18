import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchVideo, updateVideo, type ApiVideo, type VideoInput } from "@/lib/api";
import { VIDEO_CATEGORIES } from "@/data/videos";
import { ArrowLeft, Check, Plus, X, GripVertical } from "lucide-react";

// Form types
interface VideoFormData {
  id: string;
  title: string;
  description: string;
  category: string;
  chapter: string;
  durationSeconds: string;
  recordedAt: string;
  status: string;
  angles: { id: string; label: string; bunnyStreamId: string; subtitleUrl: string }[];
  exercises: { name: string; startSeconds: string; endSeconds: string }[];
}

function Input({ label, value, onChange, placeholder, type = "text", required, disabled, className }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; disabled?: boolean; className?: string;
}) {
  return (
    <label className={`block ${className || ""}`}>
      <span className="text-xs text-zinc-400 mb-1 block">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} required={required} disabled={disabled}
        className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
      />
    </label>
  );
}

const CATEGORIES = Object.entries(VIDEO_CATEGORIES).map(([value, { label }]) => ({ value, label }));

const STATUS_OPTIONS = [
  { value: "draft", label: "下書き" },
  { value: "published", label: "公開" },
  { value: "archived", label: "アーカイブ" },
];

function apiToForm(v: ApiVideo): VideoFormData {
  return {
    id: v.id, title: v.title, description: v.description || "",
    category: v.category, chapter: v.chapter || "",
    durationSeconds: v.durationSeconds?.toString() || "",
    recordedAt: v.recordedAt || "",
    status: v.status || "draft",
    angles: v.angles.map(a => ({
      id: a.id, label: a.label, bunnyStreamId: a.bunnyStreamId || "", subtitleUrl: a.subtitleUrl || "",
    })),
    exercises: v.chapters?.map(c => ({
      name: c.name, startSeconds: c.start.toString(), endSeconds: c.end.toString(),
    })) || [],
  };
}

function formToInput(form: VideoFormData): VideoInput {
  return {
    id: form.id, title: form.title,
    description: form.description || undefined,
    category: form.category,
    chapter: form.chapter || undefined,
    durationSeconds: form.durationSeconds ? Number(form.durationSeconds) : undefined,
    recordedAt: form.recordedAt || undefined,
    angles: form.angles.filter(a => a.id && a.label).map(a => ({
      id: a.id, label: a.label,
      bunnyStreamId: a.bunnyStreamId || undefined,
      subtitleUrl: a.subtitleUrl || undefined,
    })),
    exercises: form.exercises.length
      ? form.exercises.filter(e => e.name).map(e => ({
          name: e.name, startSeconds: Number(e.startSeconds) || 0, endSeconds: Number(e.endSeconds) || 0,
        }))
      : undefined,
  };
}

export default function VideoEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<VideoFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchVideo(id)
      .then(v => setForm(apiToForm(v)))
      .catch(() => showToast("error", "動画の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  const handleSave = useCallback(async () => {
    if (!form || !id) return;
    if (!form.title || form.angles.length === 0) {
      showToast("error", "タイトル・アングルは必須です");
      return;
    }
    setSaving(true);
    try {
      await updateVideo(id, formToInput(form));
      showToast("success", "動画を更新しました");
      setTimeout(() => navigate("/admin/videos"), 500);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "保存に失敗しました");
    }
    setSaving(false);
  }, [form, id, navigate, showToast]);

  // Form helpers
  function updateForm<K extends keyof VideoFormData>(key: K, value: VideoFormData[K]) {
    setForm(prev => prev ? { ...prev, [key]: value } : null);
  }
  function updateAngle(index: number, key: string, value: string) {
    setForm(prev => {
      if (!prev) return null;
      const angles = [...prev.angles];
      angles[index] = { ...angles[index], [key]: value };
      return { ...prev, angles };
    });
  }
  function addAngle() {
    setForm(prev => prev ? { ...prev, angles: [...prev.angles, { id: "", label: "", bunnyStreamId: "", subtitleUrl: "" }] } : null);
  }
  function removeAngle(index: number) {
    setForm(prev => prev ? { ...prev, angles: prev.angles.filter((_, i) => i !== index) } : null);
  }
  function updateExercise(index: number, key: string, value: string) {
    setForm(prev => {
      if (!prev) return null;
      const exercises = [...prev.exercises];
      exercises[index] = { ...exercises[index], [key]: value };
      return { ...prev, exercises };
    });
  }
  function addExercise() {
    setForm(prev => prev ? { ...prev, exercises: [...prev.exercises, { name: "", startSeconds: "", endSeconds: "" }] } : null);
  }
  function removeExercise(index: number) {
    setForm(prev => prev ? { ...prev, exercises: prev.exercises.filter((_, i) => i !== index) } : null);
  }

  if (loading || !form) {
    return <div className="flex items-center justify-center py-20"><div className="text-zinc-500 text-sm">読み込み中...</div></div>;
  }

  const embedUrl = `${window.location.origin}/embed/${form.id}`;
  const iframeSnippet = `<iframe src="${embedUrl}?layout=equal" class="w-full aspect-video" allow="fullscreen" frameborder="0"></iframe>`;

  return (
    <div className="p-6 max-w-3xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>{toast.message}</div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/admin/videos")} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-semibold text-zinc-200">動画を編集</h2>
        <span className="text-xs text-zinc-600 font-mono">{form.id}</span>
      </div>

      <div className="space-y-6">
        {/* Basic info section */}
        <section className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">基本情報</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="ID (URL用)" value={form.id} onChange={() => {}} placeholder="stretch-full" required disabled />
            <div>
              <span className="text-xs text-zinc-400 mb-1 block">カテゴリ<span className="text-red-400 ml-0.5">*</span></span>
              <select value={form.category} onChange={e => updateForm("category", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/50">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <Input label="タイトル" value={form.title} onChange={v => updateForm("title", v)} placeholder="ストレッチ＆モビリティ" required />
          <div>
            <span className="text-xs text-zinc-400 mb-1 block">説明</span>
            <textarea value={form.description} onChange={e => updateForm("description", e.target.value)}
              placeholder="動画の説明..." rows={3}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Input label="チャプター名" value={form.chapter} onChange={v => updateForm("chapter", v)} placeholder="ストレッチ" />
            <Input label="再生時間 (秒)" value={form.durationSeconds} onChange={v => updateForm("durationSeconds", v)} type="number" placeholder="612" />
            <Input label="収録日" value={form.recordedAt} onChange={v => updateForm("recordedAt", v)} type="date" />
            <div>
              <span className="text-xs text-zinc-400 mb-1 block">ステータス</span>
              <select value={form.status} onChange={e => updateForm("status", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/50">
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Angles section */}
        <section className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">アングル ({form.angles.length})</h3>
            <button onClick={addAngle} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
              <Plus className="h-3 w-3" />追加
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
                  <button onClick={() => removeAngle(i)} className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="ID" value={angle.id} onChange={v => updateAngle(i, "id", v)} placeholder="stretch-front" required />
                <Input label="ラベル" value={angle.label} onChange={v => updateAngle(i, "label", v)} placeholder="正面" required />
              </div>
              <Input label="Bunny Stream ID" value={angle.bunnyStreamId} onChange={v => updateAngle(i, "bunnyStreamId", v)} placeholder="5315b34e-..." />
              <Input label="字幕URL (WebVTT)" value={angle.subtitleUrl} onChange={v => updateAngle(i, "subtitleUrl", v)} placeholder="/subs/stretch.vtt" />
            </div>
          ))}
        </section>

        {/* Exercises section */}
        <section className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">チャプター ({form.exercises.length})</h3>
            <button onClick={addExercise} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
              <Plus className="h-3 w-3" />追加
            </button>
          </div>
          {form.exercises.length === 0 && <p className="text-xs text-zinc-600 py-2">チャプターを追加するとプレイヤーにオーバーレイ表示されます。</p>}
          {form.exercises.map((ex, i) => (
            <div key={i} className="flex items-end gap-3 bg-zinc-800/50 rounded-lg p-3">
              <Input label="名前" value={ex.name} onChange={v => updateExercise(i, "name", v)} placeholder="長座体前屈" className="flex-1" required />
              <Input label="開始 (秒)" value={ex.startSeconds} onChange={v => updateExercise(i, "startSeconds", v)} type="number" placeholder="0" className="w-24" />
              <Input label="終了 (秒)" value={ex.endSeconds} onChange={v => updateExercise(i, "endSeconds", v)} type="number" placeholder="90" className="w-24" />
              <button onClick={() => removeExercise(i)} className="p-2 rounded text-zinc-500 hover:text-red-400 transition-colors mb-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </section>

        {/* Embed section */}
        <section className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Embed</h3>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs text-zinc-500">URL</span>
              <button onClick={() => { navigator.clipboard.writeText(embedUrl); showToast("success", "コピーしました"); }}
                className="text-xs text-primary hover:text-primary/80">コピー</button>
            </div>
            <code className="text-xs text-zinc-300 break-all">{embedUrl}</code>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs text-zinc-500">iframe</span>
              <button onClick={() => { navigator.clipboard.writeText(iframeSnippet); showToast("success", "コピーしました"); }}
                className="text-xs text-primary hover:text-primary/80">コピー</button>
            </div>
            <code className="text-xs text-zinc-300 break-all">{iframeSnippet}</code>
          </div>
        </section>

        {/* Save actions */}
        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            <Check className="h-4 w-4" />{saving ? "保存中..." : "更新"}
          </button>
          <button onClick={() => navigate("/admin/videos")}
            className="px-5 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchVideos, deleteVideo, patchVideoStatus, type ApiVideo } from "@/lib/api";
import { videos as staticVideos, VIDEO_CATEGORIES, type VideoCategoryKey } from "@/data/videos";
import { Plus, Trash2, Copy, Pencil, Search, Eye, EyeOff, Film } from "lucide-react";

const STATUS_CONFIG = {
  draft: { label: "下書き", color: "bg-zinc-600 text-zinc-200" },
  published: { label: "公開", color: "bg-emerald-600/20 text-emerald-400" },
  archived: { label: "アーカイブ", color: "bg-amber-600/20 text-amber-400" },
} as const;

export default function AdminVideoListPage() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<ApiVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchVideos();
      setVideos(data);
      setApiAvailable(true);
    } catch {
      // fallback to static
      setVideos(staticVideos.map(v => ({
        id: v.id,
        title: v.title,
        description: v.description,
        category: v.category,
        angles: v.angles.map(a => ({
          id: a.id, label: a.label, hlsUrl: "", thumbnailUrl: "",
          bunnyStreamId: a.bunnyStreamId, subtitleUrl: a.subtitleUrl,
        })),
        chapters: v.exercises?.map(e => ({ name: e.name, start: e.startSeconds, end: e.endSeconds })),
        durationSeconds: v.durationSeconds,
        recordedAt: v.recordedAt,
        chapter: v.chapter,
        status: "published" as const,
      })));
      setApiAvailable(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadVideos(); }, [loadVideos]);

  const handleDelete = useCallback(async (video: ApiVideo) => {
    if (!confirm(`「${video.title}」を削除しますか？`)) return;
    try {
      await deleteVideo(video.id);
      showToast("success", "動画を削除しました");
      await loadVideos();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "削除に失敗しました");
    }
  }, [loadVideos, showToast]);

  const handleStatusToggle = useCallback(async (video: ApiVideo) => {
    const newStatus = video.status === "published" ? "draft" : "published";
    try {
      await patchVideoStatus(video.id, newStatus);
      showToast("success", newStatus === "published" ? "公開しました" : "非公開にしました");
      await loadVideos();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "ステータス変更に失敗しました");
    }
  }, [loadVideos, showToast]);

  const copyEmbedUrl = useCallback((videoId: string) => {
    const url = `${window.location.origin}/embed/${videoId}`;
    navigator.clipboard.writeText(url).then(
      () => showToast("success", "Embed URLをコピーしました"),
      () => showToast("error", "コピーに失敗しました"),
    );
  }, [showToast]);

  // Filter videos
  const filtered = videos.filter(v => {
    if (search) {
      const q = search.toLowerCase();
      if (!v.title.toLowerCase().includes(q) && !(v.description || "").toLowerCase().includes(q)) return false;
    }
    if (categoryFilter && v.category !== categoryFilter) return false;
    if (statusFilter && v.status !== statusFilter) return false;
    return true;
  });

  const CATEGORIES = Object.entries(VIDEO_CATEGORIES).map(([value, { label }]) => ({ value, label }));

  return (
    <div className="p-6 max-w-5xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-zinc-200">動画管理</h2>
        <button
          onClick={() => navigate("/admin/videos/new")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          新規動画
        </button>
      </div>

      {/* API warning */}
      {!apiAvailable && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2.5 text-sm text-amber-400 mb-4">
          APIに接続できません。静的データを表示中です。
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="検索..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">全カテゴリ</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">全ステータス</option>
          <option value="published">公開</option>
          <option value="draft">下書き</option>
          <option value="archived">アーカイブ</option>
        </select>
        <span className="text-xs text-zinc-500">{filtered.length}件</span>
      </div>

      {/* Video list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-zinc-500 text-sm">読み込み中...</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((video) => {
            const cat = VIDEO_CATEGORIES[video.category as VideoCategoryKey];
            const status = STATUS_CONFIG[video.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
            const thumbnail = video.angles[0]?.thumbnailUrl;

            return (
              <div
                key={video.id}
                className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-3 flex items-center gap-3 group hover:border-zinc-700/60 transition-colors"
              >
                {/* Thumbnail */}
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt=""
                    className="w-24 h-14 object-cover rounded-lg bg-zinc-800 shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-24 h-14 rounded-lg bg-zinc-800 shrink-0 flex items-center justify-center">
                    <Film className="h-5 w-5 text-zinc-600" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {cat && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-200 truncate">{video.title}</h3>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-zinc-500">
                    <span>{video.angles.length} アングル</span>
                    {video.durationSeconds && <span>{Math.floor(video.durationSeconds / 60)}分</span>}
                    {video.chapters && video.chapters.length > 0 && <span>{video.chapters.length} チャプター</span>}
                    {video.recordedAt && <span>{video.recordedAt}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleStatusToggle(video)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    title={video.status === "published" ? "非公開にする" : "公開する"}
                  >
                    {video.status === "published" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => copyEmbedUrl(video.id)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    title="Embed URLをコピー"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => navigate(`/admin/videos/${video.id}`)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors"
                    title="編集"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(video)}
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
      )}
    </div>
  );
}

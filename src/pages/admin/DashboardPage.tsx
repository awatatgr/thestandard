import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Clock, FolderOpen, Plus } from "lucide-react";
import { fetchAdminStats, type AdminStats } from "@/lib/api";
import { VIDEO_CATEGORIES, type VideoCategoryKey } from "@/data/videos";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}時間${m % 60}分`;
  return `${m}分`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-zinc-500 text-sm">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-zinc-200">ダッシュボード</h2>
        <button
          onClick={() => navigate("/admin/videos/new")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          新規動画
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "動画数", value: stats?.totalVideos ?? 0, icon: Film },
          { label: "総時間", value: formatDuration(stats?.totalDurationSeconds ?? 0), icon: Clock },
          { label: "カテゴリ", value: stats?.totalCategories ?? 0, icon: FolderOpen },
          { label: "公開中", value: stats?.statusCounts?.published ?? 0, icon: Film },
        ].map((card) => (
          <div key={card.label} className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="h-4 w-4 text-zinc-500" />
              <span className="text-xs text-zinc-500">{card.label}</span>
            </div>
            <div className="text-2xl font-bold text-zinc-100">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Recent videos */}
      {stats?.recentVideos && stats.recentVideos.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-zinc-400 mb-3">最近の更新</h3>
          <div className="space-y-2">
            {stats.recentVideos.map((video) => {
              const cat = VIDEO_CATEGORIES[video.category as VideoCategoryKey];
              return (
                <button
                  key={video.id}
                  onClick={() => navigate(`/admin/videos/${video.id}`)}
                  className="w-full flex items-center gap-3 bg-zinc-900/80 border border-zinc-800/60 rounded-lg p-3 hover:border-zinc-700/60 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-200 truncate">{video.title}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{video.updatedAt?.split("T")[0]}</div>
                  </div>
                  {cat && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${cat.color}`}>
                      {cat.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

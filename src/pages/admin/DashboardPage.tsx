import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Clock, FolderOpen, Plus, HardDrive, Monitor, Upload, Cpu } from "lucide-react";
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
      {/* Mac Ingest App */}
      <section className="mt-8">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">動画を追加する</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Mac App card */}
          <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Monitor className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">Mac Ingest App</h4>
                <p className="text-[10px] text-zinc-500">SSD/HDD差すだけで全自動</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { icon: HardDrive, text: "SSD/HDD接続を自動検出、カメラ判定" },
                { icon: Cpu, text: "Apple Log→Rec.709 色補正 + H.264エンコード" },
                { icon: Upload, text: "Bunny.net にアップロード → API に自動登録" },
              ].map((step) => (
                <div key={step.text} className="flex items-start gap-2">
                  <step.icon className="h-3.5 w-3.5 text-zinc-600 mt-0.5 shrink-0" />
                  <span className="text-xs text-zinc-400">{step.text}</span>
                </div>
              ))}
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-[10px] text-zinc-500 mb-1.5">インストール</p>
              <code className="text-[11px] text-zinc-300 block">cd apps/ingest && npx tauri dev</code>
              <p className="text-[10px] text-zinc-600 mt-2">
                ビルド済み .dmg: <code className="text-zinc-500">apps/ingest/src-tauri/target/release/bundle/dmg/</code>
              </p>
            </div>
          </div>

          {/* Manual add card */}
          <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Plus className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-200">手動で追加</h4>
                <p className="text-[10px] text-zinc-500">管理画面からStream IDを登録</p>
              </div>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Bunny.net にアップロード済みの動画をStream ID指定で登録します。タイトル、カテゴリ、アングル、チャプターを手動設定。
            </p>
            <button
              onClick={() => navigate("/admin/videos/new")}
              className="w-full py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
            >
              新規動画を追加
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

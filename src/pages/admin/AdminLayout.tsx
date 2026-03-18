import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Film, ArrowLeft } from "lucide-react";

const navItems = [
  { to: "/admin", label: "ダッシュボード", icon: LayoutDashboard, end: true },
  { to: "/admin/videos", label: "動画管理", icon: Film, end: false },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-zinc-800/60 bg-zinc-950 flex flex-col">
        <div className="h-12 px-4 flex items-center gap-2 border-b border-zinc-800/60">
          <h1 className="text-sm font-bold tracking-wider text-zinc-200">THE STANDARD</h1>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">Admin</span>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100 font-medium"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-zinc-800/60">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            サイトに戻る
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

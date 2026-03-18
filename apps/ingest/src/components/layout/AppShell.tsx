import { cn } from "@/lib/utils";
import { Workflow, Settings } from "lucide-react";

type Page = "pipeline" | "settings";

interface AppShellProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

const navItems: { page: Page; label: string; icon: typeof Workflow }[] = [
  { page: "pipeline", label: "パイプライン", icon: Workflow },
  { page: "settings", label: "設定", icon: Settings },
];

export function AppShell({ currentPage, onNavigate, children }: AppShellProps) {
  return (
    <div className="flex h-screen">
      <aside className="w-56 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="font-bold text-sm tracking-wide">THE STANDARD</h1>
          <span className="text-xs text-muted-foreground">Ingest</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ page, label, icon: Icon }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                currentPage === page
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border text-xs text-muted-foreground">
          v0.1.0
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

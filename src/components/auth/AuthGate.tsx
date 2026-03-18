import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isAuthEnabled } from "@/lib/features";

export function AuthGate({ children, requireAdmin }: { children: ReactNode; requireAdmin?: boolean }) {
  const { user, loading, isAdmin } = useAuth();

  // Auth not configured → pass through (demo / dev mode)
  if (!isAuthEnabled()) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">読み込み中...</div>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin required check
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

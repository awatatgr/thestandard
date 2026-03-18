import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthGate } from "./components/auth/AuthGate";
import VideoListPage from "./pages/VideoListPage";
import VideoDetailPage from "./pages/VideoDetailPage";

const EmbedPage = lazy(() => import("./pages/EmbedPage"));
const OpenSourcePage = lazy(() => import("./pages/OpenSourcePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage"));
const AdminVideoListPage = lazy(() => import("./pages/admin/VideoListPage"));
const VideoEditPage = lazy(() => import("./pages/admin/VideoEditPage"));
const VideoCreatePage = lazy(() => import("./pages/admin/VideoCreatePage"));

function ProtectedLayout() {
  return (
    <AuthGate>
      <Outlet />
    </AuthGate>
  );
}

function AdminProtectedLayout() {
  return (
    <AuthGate requireAdmin>
      <Outlet />
    </AuthGate>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground text-sm">読み込み中...</div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public routes */}
          <Route path="/embed/:videoId" element={<EmbedPage />} />
          <Route path="/open-source" element={<OpenSourcePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected viewer routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<VideoListPage />} />
            <Route path="/videos/:id" element={<VideoDetailPage />} />
          </Route>

          {/* Admin routes (require admin role) */}
          <Route element={<AdminProtectedLayout />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="videos" element={<AdminVideoListPage />} />
              <Route path="videos/new" element={<VideoCreatePage />} />
              <Route path="videos/:id" element={<VideoEditPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

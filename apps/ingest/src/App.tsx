import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PipelinePage } from "@/pages/PipelinePage";
import { SettingsPage } from "@/pages/SettingsPage";

type Page = "pipeline" | "settings";

export default function App() {
  const [page, setPage] = useState<Page>("pipeline");

  return (
    <AppShell currentPage={page} onNavigate={setPage}>
      {page === "pipeline" ? <PipelinePage /> : <SettingsPage />}
    </AppShell>
  );
}

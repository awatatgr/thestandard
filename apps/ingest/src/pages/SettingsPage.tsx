import { useSettings } from "@/hooks/use-settings";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { Loader2 } from "lucide-react";

export function SettingsPage() {
  const { settings, setSettings, saveSettings, loading, saving, error } =
    useSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-lg font-semibold mb-6">設定</h2>
      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <SettingsForm
        settings={settings}
        onChange={setSettings}
        onSave={saveSettings}
        saving={saving}
      />
    </div>
  );
}

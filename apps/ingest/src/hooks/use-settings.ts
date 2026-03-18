import { useState, useEffect, useCallback } from "react";
import type { AppSettings } from "@/lib/types";
import { getSettings, saveSettings as saveSettingsApi } from "@/lib/tauri";

const defaultSettings: AppSettings = {
  bunny_api_key: null,
  bunny_library_id: null,
  bunny_cdn_hostname: null,
  api_endpoint: null,
  admin_token: null,
  lut_path: null,
  footage_base: null,
  output_resolution: "1920x1080",
  cameras: [
    { id: "front", label: "正面", model_pattern: "iPhone 15 Pro Max" },
    { id: "side", label: "側面", model_pattern: "iPhone 16 Pro" },
  ],
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = useCallback(
    async (updated: AppSettings) => {
      setSaving(true);
      setError(null);
      try {
        await saveSettingsApi(updated);
        setSettings(updated);
      } catch (e) {
        setError(String(e));
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return { settings, setSettings, saveSettings, loading, saving, error };
}

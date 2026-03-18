import { useState } from "react";
import type { AppSettings, CameraConfig } from "@/lib/types";
import { importWebConfig, testApiConnection } from "@/lib/tauri";
import {
  CheckCircle,
  XCircle,
  Clipboard,
  Plus,
  Trash2,
  Loader2,
  Wifi,
} from "lucide-react";

interface SettingsFormProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onSave: (settings: AppSettings) => Promise<void>;
  saving: boolean;
}

export function SettingsForm({
  settings,
  onChange,
  onSave,
  saving,
}: SettingsFormProps) {
  const [importJson, setImportJson] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  const update = (key: keyof AppSettings, value: string | null) => {
    onChange({ ...settings, [key]: value || null });
  };

  const handleImport = async () => {
    try {
      const result = await importWebConfig(importJson);
      onChange(result);
      setImportStatus("インポート成功");
      setImportJson("");
    } catch (e) {
      setImportStatus(`エラー: ${e}`);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionStatus(null);
    try {
      const status = await testApiConnection();
      setConnectionStatus(status);
    } catch (e) {
      setConnectionStatus({ connected: false, message: String(e) });
    } finally {
      setTesting(false);
    }
  };

  const addCamera = () => {
    const cameras = [
      ...settings.cameras,
      { id: `cam-${settings.cameras.length + 1}`, label: "", model_pattern: "" },
    ];
    onChange({ ...settings, cameras });
  };

  const removeCamera = (index: number) => {
    const cameras = settings.cameras.filter((_, i) => i !== index);
    onChange({ ...settings, cameras });
  };

  const updateCamera = (
    index: number,
    key: keyof CameraConfig,
    value: string,
  ) => {
    const cameras = settings.cameras.map((c, i) =>
      i === index ? { ...c, [key]: value } : c,
    );
    onChange({ ...settings, cameras });
  };

  return (
    <div className="space-y-8">
      {/* Web Import */}
      <section>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Clipboard className="h-4 w-4" />
          Webからインポート
        </h3>
        <p className="text-xs text-muted-foreground mb-2">
          Admin Dashboard の「Ingest App 接続」ボタンでコピーしたJSONを貼り付けてください。
        </p>
        <div className="flex gap-2">
          <textarea
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20 font-mono"
            placeholder='{"api_endpoint": "...", "admin_token": "...", "bunny_cdn_hostname": "..."}'
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button
            className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50"
            onClick={handleImport}
            disabled={!importJson.trim()}
          >
            インポート
          </button>
          {importStatus && (
            <span className="text-xs text-muted-foreground">
              {importStatus}
            </span>
          )}
        </div>
      </section>

      {/* API Connection */}
      <section>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Wifi className="h-4 w-4" />
          API接続
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="API Endpoint"
            value={settings.api_endpoint}
            onChange={(v) => update("api_endpoint", v)}
            placeholder="https://thestandard.pages.dev"
          />
          <Field
            label="Admin Token"
            value={settings.admin_token}
            onChange={(v) => update("admin_token", v)}
            type="password"
          />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            className="px-3 py-1.5 rounded-md border border-input text-sm flex items-center gap-1.5 disabled:opacity-50"
            onClick={handleTestConnection}
            disabled={testing || !settings.api_endpoint || !settings.admin_token}
          >
            {testing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wifi className="h-3.5 w-3.5" />
            )}
            接続テスト
          </button>
          {connectionStatus && (
            <span
              className={`text-xs flex items-center gap-1 ${connectionStatus.connected ? "text-green-500" : "text-red-500"}`}
            >
              {connectionStatus.connected ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {connectionStatus.message}
            </span>
          )}
        </div>
      </section>

      {/* Bunny.net */}
      <section>
        <h3 className="text-sm font-medium mb-3">Bunny.net</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="API Key"
            value={settings.bunny_api_key}
            onChange={(v) => update("bunny_api_key", v)}
            type="password"
          />
          <Field
            label="Library ID"
            value={settings.bunny_library_id}
            onChange={(v) => update("bunny_library_id", v)}
          />
          <Field
            label="CDN Hostname"
            value={settings.bunny_cdn_hostname}
            onChange={(v) => update("bunny_cdn_hostname", v)}
            placeholder="vz-xxx.b-cdn.net"
          />
        </div>
      </section>

      {/* Encoding */}
      <section>
        <h3 className="text-sm font-medium mb-3">エンコード設定</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="LUT ファイルパス"
            value={settings.lut_path}
            onChange={(v) => update("lut_path", v)}
            placeholder="~/LUTs/AppleLogToRec709.cube"
          />
          <Field
            label="フッテージ保存先"
            value={settings.footage_base}
            onChange={(v) => update("footage_base", v)}
            placeholder="~/footage"
          />
          <Field
            label="出力解像度"
            value={settings.output_resolution}
            onChange={(v) => update("output_resolution", v)}
            placeholder="1920x1080"
          />
        </div>
      </section>

      {/* Cameras */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">カメラ設定</h3>
          <button
            className="px-2 py-1 rounded-md border border-input text-xs flex items-center gap-1"
            onClick={addCamera}
          >
            <Plus className="h-3 w-3" />
            追加
          </button>
        </div>
        <div className="space-y-3">
          {settings.cameras.map((camera, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_1.5fr_auto] gap-2 items-end"
            >
              <Field
                label={i === 0 ? "ID" : undefined}
                value={camera.id}
                onChange={(v) => updateCamera(i, "id", v)}
                placeholder="front"
              />
              <Field
                label={i === 0 ? "ラベル" : undefined}
                value={camera.label}
                onChange={(v) => updateCamera(i, "label", v)}
                placeholder="正面"
              />
              <Field
                label={i === 0 ? "モデルパターン" : undefined}
                value={camera.model_pattern}
                onChange={(v) => updateCamera(i, "model_pattern", v)}
                placeholder="iPhone 15 Pro Max"
              />
              <button
                className="p-2 rounded-md text-muted-foreground hover:text-destructive disabled:opacity-30"
                onClick={() => removeCamera(i)}
                disabled={settings.cameras.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end pt-4 border-t border-border">
        <button
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm flex items-center gap-2 disabled:opacity-50"
          onClick={() => onSave(settings)}
          disabled={saving}
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          保存
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label?: string;
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      {label && (
        <label className="block text-xs text-muted-foreground mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

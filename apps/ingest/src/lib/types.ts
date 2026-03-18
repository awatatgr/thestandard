export interface CameraConfig {
  id: string;
  label: string;
  model_pattern: string;
}

export interface AppSettings {
  bunny_api_key: string | null;
  bunny_library_id: string | null;
  bunny_cdn_hostname: string | null;
  api_endpoint: string | null;
  admin_token: string | null;
  lut_path: string | null;
  footage_base: string | null;
  output_resolution: string | null;
  cameras: CameraConfig[];
}

export interface ConnectionStatus {
  connected: boolean;
  message: string;
}

export interface DetectedVolume {
  path: string;
  name: string;
  video_count: number;
  size_bytes: number;
}

export interface FileClassification {
  path: string;
  camera_id: string | null;
  model_name: string | null;
}

export interface PipelineProgress {
  pipeline_id: string;
  file_path: string;
  step: string;
  progress_pct: number;
  message: string;
}

const API_BASE = "/api";

// --- API Response Types ---

export interface ApiVideoAngle {
  id: string;
  label: string;
  hlsUrl: string;
  thumbnailUrl: string;
  subtitleUrl?: string;
  bunnyStreamId?: string;
  videoUrl?: string;
}

export interface ApiVideoChapter {
  name: string;
  start: number;
  end: number;
}

export interface ApiVideo {
  id: string;
  title: string;
  description?: string;
  category: string;
  angles: ApiVideoAngle[];
  chapters?: ApiVideoChapter[];
  durationSeconds?: number;
  recordedAt?: string;
  chapter?: string;
}

// --- Input types (for create/update) ---

export interface VideoAngleInput {
  id: string;
  label: string;
  bunnyStreamId?: string;
  videoUrl?: string;
  subtitleUrl?: string;
}

export interface ExerciseInput {
  name: string;
  startSeconds: number;
  endSeconds: number;
}

export interface VideoInput {
  id: string;
  title: string;
  description?: string;
  category: string;
  angles: VideoAngleInput[];
  durationSeconds?: number;
  recordedAt?: string;
  chapter?: string;
  exercises?: ExerciseInput[];
}

// --- API Client ---

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `API error: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function fetchVideos(): Promise<ApiVideo[]> {
  return apiFetch("/videos");
}

export function fetchVideo(id: string): Promise<ApiVideo> {
  return apiFetch(`/videos/${encodeURIComponent(id)}`);
}

export function createVideo(video: VideoInput): Promise<ApiVideo> {
  return apiFetch("/videos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(video),
  });
}

export function updateVideo(id: string, video: VideoInput): Promise<ApiVideo> {
  return apiFetch(`/videos/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(video),
  });
}

export function deleteVideo(id: string): Promise<void> {
  return apiFetch(`/videos/${encodeURIComponent(id)}`, { method: "DELETE" });
}

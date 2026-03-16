import { getBunnyHlsUrl, getBunnyThumbnailUrl } from "@/lib/bunny";

// --- Types ---

export interface VideoAngle {
  id: string;
  label: string; // "正面", "左側", "編集済み" etc.
  bunnyStreamId?: string;
  videoUrl?: string; // fallback MP4 URL
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  category: VideoCategoryKey;
  angles: VideoAngle[];
  durationSeconds?: number;
  recordedAt?: string;
  chapter?: string;
}

// --- Categories ---

export const VIDEO_CATEGORIES = {
  training: { label: "トレーニング", color: "bg-blue-600 text-white" },
  drill: { label: "ドリル", color: "bg-amber-600 text-white" },
  method: { label: "メソッド", color: "bg-emerald-600 text-white" },
  interview: { label: "インタビュー", color: "bg-purple-600 text-white" },
} as const;

export type VideoCategoryKey = keyof typeof VIDEO_CATEGORIES;

// --- Helpers ---

export function getAngleHlsUrl(angle: VideoAngle): string {
  if (angle.bunnyStreamId) return getBunnyHlsUrl(angle.bunnyStreamId);
  return "";
}

export function getAngleThumbnailUrl(angle: VideoAngle): string {
  if (angle.bunnyStreamId) return getBunnyThumbnailUrl(angle.bunnyStreamId);
  return "";
}

export function getAngleSrc(angle: VideoAngle): { hlsUrl: string; fallbackUrl: string } {
  return {
    hlsUrl: getAngleHlsUrl(angle),
    fallbackUrl: angle.videoUrl || "",
  };
}

export function getPrimaryAngle(video: Video): VideoAngle {
  return video.angles[0];
}

export function getPrimaryThumbnail(video: Video): string {
  const angle = getPrimaryAngle(video);
  return getAngleThumbnailUrl(angle);
}

// --- Sample Data ---

export const videos: Video[] = [
  {
    id: "1",
    title: "正しいスクワットの基本",
    description:
      "伊野波メソッドによるスクワットの正しいフォーム。重心の位置、膝の角度、背中のラインを徹底解説。",
    category: "method",
    chapter: "第1章: 基本動作",
    recordedAt: "2026-03-16",
    durationSeconds: 480,
    angles: [
      {
        id: "1-edited",
        label: "編集済み",
        videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      },
      {
        id: "1-front",
        label: "正面",
        videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      },
      {
        id: "1-side",
        label: "左側",
        videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      },
    ],
  },
  {
    id: "2",
    title: "歩行分析 — 重心移動のメカニズム",
    description: "歩行時の足裏の重心移動を可視化。一般的な間違いパターンと正しい重心移動の比較。",
    category: "training",
    chapter: "第2章: 歩行",
    recordedAt: "2026-03-16",
    durationSeconds: 360,
    angles: [
      {
        id: "2-front",
        label: "正面",
        videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      },
      {
        id: "2-side",
        label: "側面",
        videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      },
    ],
  },
  {
    id: "3",
    title: "NG vs 正解：膝の使い方",
    description: "よくある膝の間違った使い方（Before）と、正しいフォーム（After）の対比映像。",
    category: "drill",
    recordedAt: "2026-03-16",
    durationSeconds: 240,
    angles: [
      {
        id: "3-main",
        label: "メイン",
        videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      },
    ],
  },
];

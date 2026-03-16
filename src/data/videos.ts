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
    id: "legacy-01",
    title: "トレーナーメソッド — セッション1",
    description: "トレーナーによるヨガ・ストレッチの実演。正面と側面の2アングルで動きの詳細を確認できます。",
    category: "training",
    chapter: "ヨガ・ストレッチ",
    recordedAt: "2026-03-16",
    durationSeconds: 99,
    angles: [
      {
        id: "legacy-01-front",
        label: "正面",
        videoUrl: "/videos/front_01.mp4",
      },
      {
        id: "legacy-01-side",
        label: "側面",
        videoUrl: "/videos/side_01.mp4",
      },
    ],
  },
];

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
    title: "トレッドミルでランニングフォーム分析",
    description: "トレーナー指導のもと、トレッドミルを使ったランニングフォームのチェック。側面と正面の2アングルから撮影。",
    category: "training",
    chapter: "ランニング",
    recordedAt: "2026-03-16",
    durationSeconds: 99,
    angles: [
      {
        id: "legacy-01-front",
        label: "正面",
        videoUrl: "/videos/side_01.mp4",
      },
      {
        id: "legacy-01-side",
        label: "側面",
        videoUrl: "/videos/front_01.mp4",
      },
    ],
  },
  {
    id: "legacy-02",
    title: "ウォームアップ＆ストレッチ",
    description: "トレーナー指導のもと、人工芝エリアでバンドを使ったストレッチとウォームアップ。柔軟性と可動域の改善を目的としたセッション。",
    category: "training",
    chapter: "ストレッチ",
    recordedAt: "2026-03-16",
    durationSeconds: 137,
    angles: [
      {
        id: "legacy-02-front",
        label: "正面",
        videoUrl: "/videos/front_02.mp4",
      },
      {
        id: "legacy-02-side",
        label: "側面",
        videoUrl: "/videos/side_02.mp4",
      },
    ],
  },
  {
    id: "legacy-03",
    title: "トレッドミルランニング",
    description: "トレッドミルでランニングフォームのチェックとトレーニング。走行中のフォームをリアルタイムで確認しながら改善。",
    category: "training",
    chapter: "ランニング",
    recordedAt: "2026-03-16",
    durationSeconds: 215,
    angles: [
      {
        id: "legacy-03-front",
        label: "正面",
        videoUrl: "/videos/front_03.mp4",
      },
      {
        id: "legacy-03-side",
        label: "側面",
        videoUrl: "/videos/side_03.mp4",
      },
    ],
  },
  {
    id: "legacy-04",
    title: "バーベルスクワット＆ランジ",
    description: "スクワットラックでバーベルを使った下半身トレーニング。スクワットやランジなどの複合動作で脚力とバランスを鍛える。",
    category: "drill",
    chapter: "ウェイトトレーニング",
    recordedAt: "2026-03-16",
    durationSeconds: 197,
    angles: [
      {
        id: "legacy-04-front",
        label: "正面",
        videoUrl: "/videos/front_04.mp4",
      },
      {
        id: "legacy-04-side",
        label: "側面",
        videoUrl: "/videos/side_04.mp4",
      },
    ],
  },
];

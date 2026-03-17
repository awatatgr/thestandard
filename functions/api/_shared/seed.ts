// Video data types (shared between API functions)

export interface VideoAngleData {
  id: string;
  label: string;
  bunnyStreamId?: string;
  videoUrl?: string;
  subtitleUrl?: string;
}

export interface ExerciseChapterData {
  name: string;
  startSeconds: number;
  endSeconds: number;
}

export interface VideoData {
  id: string;
  title: string;
  description?: string;
  category: string;
  angles: VideoAngleData[];
  durationSeconds?: number;
  recordedAt?: string;
  chapter?: string;
  exercises?: ExerciseChapterData[];
}

// API response types (resolved URLs)
export interface AngleResponse {
  id: string;
  label: string;
  hlsUrl: string;
  thumbnailUrl: string;
  subtitleUrl?: string;
  bunnyStreamId?: string;
  videoUrl?: string;
}

export interface VideoResponse {
  id: string;
  title: string;
  description?: string;
  category: string;
  angles: AngleResponse[];
  chapters?: { name: string; start: number; end: number }[];
  durationSeconds?: number;
  recordedAt?: string;
  chapter?: string;
}

// Resolve Bunny.net URLs
export function resolveVideo(video: VideoData, cdnHostname: string): VideoResponse {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    category: video.category,
    angles: video.angles.map((a) => ({
      id: a.id,
      label: a.label,
      hlsUrl:
        a.bunnyStreamId && cdnHostname
          ? `https://${cdnHostname}/${a.bunnyStreamId}/playlist.m3u8`
          : "",
      thumbnailUrl:
        a.bunnyStreamId && cdnHostname
          ? `https://${cdnHostname}/${a.bunnyStreamId}/thumbnail.jpg`
          : "",
      subtitleUrl: a.subtitleUrl,
      bunnyStreamId: a.bunnyStreamId,
      videoUrl: a.videoUrl,
    })),
    chapters: video.exercises?.map((e) => ({
      name: e.name,
      start: e.startSeconds,
      end: e.endSeconds,
    })),
    durationSeconds: video.durationSeconds,
    recordedAt: video.recordedAt,
    chapter: video.chapter,
  };
}

// Seed data — same as src/data/videos.ts
export const seedVideos: VideoData[] = [
  {
    id: "stretch-full",
    title: "ストレッチ＆モビリティ — フルセッション",
    description:
      "撮影日のウォームアップとして行ったマット上でのストレッチ。股関節・背中・肩周りの可動域を広げるメニューを約10分で実施。",
    category: "training",
    chapter: "ストレッチ",
    recordedAt: "2026-03-16",
    durationSeconds: 612,
    angles: [
      {
        id: "stretch-full-front",
        label: "正面",
        bunnyStreamId: "5315b34e-2fb3-4fc3-8149-6d196d2466ff",
        subtitleUrl: "/subs/stretch.vtt",
      },
      {
        id: "stretch-full-side",
        label: "側面",
        bunnyStreamId: "3d10af0b-6476-41d8-aa84-418832322bcc",
      },
    ],
  },
  {
    id: "running-form",
    title: "トレッドミルでランニングフォーム分析",
    description:
      "トレーナー指導のもと、トレッドミルを使ったランニングフォームのチェック。側面と正面の2アングルから撮影。",
    category: "training",
    chapter: "ランニング",
    recordedAt: "2026-03-16",
    durationSeconds: 99,
    angles: [
      {
        id: "running-form-front",
        label: "正面",
        bunnyStreamId: "2c18bcb8-6eab-417e-8b5c-64de4690c354",
      },
      {
        id: "running-form-side",
        label: "側面",
        bunnyStreamId: "9ac90d7d-00d2-4a62-9181-cc22afe2a231",
      },
    ],
  },
  {
    id: "warmup-stretch",
    title: "ウォームアップ＆ストレッチ",
    description:
      "トレーナー指導のもと、人工芝エリアでバンドを使ったストレッチとウォームアップ。柔軟性と可動域の改善を目的としたセッション。",
    category: "training",
    chapter: "ストレッチ",
    recordedAt: "2026-03-16",
    durationSeconds: 137,
    angles: [
      {
        id: "warmup-stretch-front",
        label: "正面",
        bunnyStreamId: "7d83b8ff-4e7d-4ed1-84fe-7fe69fbfc9ba",
      },
      {
        id: "warmup-stretch-side",
        label: "側面",
        bunnyStreamId: "ec5e46d7-ba42-43be-a6b8-49403051ebbd",
      },
    ],
  },
  {
    id: "treadmill-run",
    title: "トレッドミルランニング",
    description:
      "トレッドミルでランニングフォームのチェックとトレーニング。走行中のフォームをリアルタイムで確認しながら改善。",
    category: "training",
    chapter: "ランニング",
    recordedAt: "2026-03-16",
    durationSeconds: 215,
    angles: [
      {
        id: "treadmill-run-front",
        label: "正面",
        bunnyStreamId: "75f994ea-4b46-4d75-93cb-58acab54c03d",
      },
      {
        id: "treadmill-run-side",
        label: "側面",
        bunnyStreamId: "fad14a22-e688-41c5-8d6a-8af759f8059d",
      },
    ],
  },
  {
    id: "squat-lunge",
    title: "バーベルスクワット＆ランジ",
    description:
      "スクワットラックでバーベルを使った下半身トレーニング。スクワットやランジなどの複合動作で脚力とバランスを鍛える。",
    category: "drill",
    chapter: "ウェイトトレーニング",
    recordedAt: "2026-03-16",
    durationSeconds: 197,
    angles: [
      {
        id: "squat-lunge-front",
        label: "正面",
        bunnyStreamId: "cc280173-35ac-4fe7-a18a-d3f680cf9db5",
      },
      {
        id: "squat-lunge-side",
        label: "側面",
        bunnyStreamId: "d41f917d-4da5-4483-ba92-033ccf90f569",
      },
    ],
  },
  {
    id: "stretch-3view",
    title: "3動画_ストレッチ＆モビリティ — フルセッション",
    description:
      "メイン画面にエクササイズ名・進捗テロップ付き。正面と側面の生素材も同時に確認できる3画面ビュー。",
    category: "method",
    chapter: "ストレッチ",
    recordedAt: "2026-03-16",
    durationSeconds: 612,
    exercises: [
      { name: "準備", startSeconds: 0, endSeconds: 17 },
      { name: "長座体前屈（ウォームアップ）", startSeconds: 17, endSeconds: 90 },
      { name: "長座体前屈キープ", startSeconds: 91, endSeconds: 118 },
      { name: "長座体前屈キープ（深め）", startSeconds: 119, endSeconds: 129 },
      { name: "足首回し・モビリティ", startSeconds: 130, endSeconds: 205 },
      { name: "開脚ストレッチ（サイド）", startSeconds: 206, endSeconds: 251 },
      { name: "開脚前屈ストレッチ", startSeconds: 252, endSeconds: 311 },
      { name: "ハムストリングストレッチ（右脚）", startSeconds: 312, endSeconds: 345 },
      { name: "ハムストリングストレッチ（左脚）", startSeconds: 346, endSeconds: 375 },
      { name: "両足ストレッチ", startSeconds: 376, endSeconds: 390 },
      { name: "ヒップストレッチ", startSeconds: 391, endSeconds: 443 },
      { name: "サイドストレッチ", startSeconds: 444, endSeconds: 480 },
      { name: "サイドストレッチ（逆）", startSeconds: 481, endSeconds: 522 },
      { name: "カーフストレッチ", startSeconds: 523, endSeconds: 574 },
      { name: "カーフストレッチ（逆足）", startSeconds: 575, endSeconds: 584 },
      { name: "フィニッシュ（全身伸ばし）", startSeconds: 585, endSeconds: 612 },
    ],
    angles: [
      {
        id: "stretch-3v-main",
        label: "メイン",
        bunnyStreamId: "5315b34e-2fb3-4fc3-8149-6d196d2466ff",
        subtitleUrl: "/subs/stretch.vtt",
      },
      {
        id: "stretch-3v-front",
        label: "正面",
        bunnyStreamId: "5315b34e-2fb3-4fc3-8149-6d196d2466ff",
      },
      {
        id: "stretch-3v-side",
        label: "側面",
        bunnyStreamId: "3d10af0b-6476-41d8-aa84-418832322bcc",
      },
    ],
  },
];

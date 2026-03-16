#!/usr/bin/env python3
"""
The Standard — DaVinci Resolve CLI 自動処理
============================================

DaVinci Resolve が起動している状態で実行:
  python3 scripts/process-davinci.py ~/footage/2026-03-16

動作:
  1. プロジェクト自動作成
  2. A-cam/B-cam 素材をインポート
  3. タイムライン作成 + 音声同期
  4. Apple Log → Rec.709 LUT 適用
  5. H.264 1080p レンダリングキュー追加 + 実行

前提:
  - DaVinci Resolve (無料版 or Studio) が起動していること
  - Python 3 がインストールされていること
"""

import sys
import os
import glob
from pathlib import Path
from datetime import datetime

# DaVinci Resolve Scripting API のパスを追加
RESOLVE_SCRIPT_PATHS = [
    "/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/Scripting/Modules",
    os.path.expanduser("~/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/Scripting/Modules"),
    "C:\\ProgramData\\Blackmagic Design\\DaVinci Resolve\\Support\\Developer\\Scripting\\Modules",
]

for p in RESOLVE_SCRIPT_PATHS:
    if os.path.isdir(p) and p not in sys.path:
        sys.path.append(p)

# --- Config ---
VIDEO_EXTENSIONS = (".mov", ".mp4", ".m4v", ".MOV", ".MP4")
LUT_NAME = "Apple Log to Rec.709"  # DaVinci 内蔵 LUT 名
RENDER_PRESET = "H.264 Master"
RENDER_WIDTH = 1920
RENDER_HEIGHT = 1080
RENDER_FPS = 24


def log(msg):
    print(f"\033[0;32m[DAVINCI]\033[0m {msg}")


def warn(msg):
    print(f"\033[0;33m[WARN]\033[0m {msg}")


def err(msg):
    print(f"\033[0;31m[ERROR]\033[0m {msg}")


def find_videos(folder):
    """Find video files in a folder."""
    files = []
    if not os.path.isdir(folder):
        return files
    for ext in VIDEO_EXTENSIONS:
        files.extend(glob.glob(os.path.join(folder, f"*{ext}")))
    return sorted(files)


def connect_resolve():
    """Connect to running DaVinci Resolve instance."""
    try:
        import DaVinciResolveScript as dvr
        resolve = dvr.scriptapp("Resolve")
        if resolve is None:
            err("DaVinci Resolve に接続できません")
            err("DaVinci Resolve を起動してから再実行してください")
            sys.exit(1)
        return resolve
    except ImportError:
        err("DaVinci Resolve Scripting API が見つかりません")
        err("DaVinci Resolve をインストールしてください:")
        err("  https://www.blackmagicdesign.com/products/davinciresolve")
        err("")
        err("代わりに ffmpeg 版を使用できます:")
        err("  ./scripts/process-ffmpeg.sh ~/footage/2026-03-16")
        sys.exit(1)


def create_project(resolve, project_name):
    """Create or open a project."""
    pm = resolve.GetProjectManager()

    # Check if project exists
    existing = pm.GetProjectListInCurrentFolder()
    if project_name in existing:
        log(f"既存プロジェクトを開きます: {project_name}")
        project = pm.LoadProject(project_name)
    else:
        log(f"新規プロジェクト作成: {project_name}")
        project = pm.CreateProject(project_name)

    if project is None:
        err(f"プロジェクト作成失敗: {project_name}")
        sys.exit(1)

    # Set project settings
    project.SetSetting("timelineFrameRate", str(RENDER_FPS))
    project.SetSetting("timelineResolutionWidth", str(RENDER_WIDTH))
    project.SetSetting("timelineResolutionHeight", str(RENDER_HEIGHT))

    return project


def import_media(project, a_cam_files, b_cam_files):
    """Import media files into the media pool."""
    mp = project.GetMediaPool()
    root = mp.GetRootFolder()

    # Create bins
    a_bin = mp.AddSubFolder(root, "A-cam")
    b_bin = mp.AddSubFolder(root, "B-cam")

    a_clips = []
    b_clips = []

    if a_cam_files:
        mp.SetCurrentFolder(a_bin if a_bin else root)
        items = mp.ImportMedia(a_cam_files)
        if items:
            a_clips = items
            log(f"A-cam: {len(items)}本インポート")

    if b_cam_files:
        mp.SetCurrentFolder(b_bin if b_bin else root)
        items = mp.ImportMedia(b_cam_files)
        if items:
            b_clips = items
            log(f"B-cam: {len(items)}本インポート")

    return a_clips, b_clips


def create_synced_timelines(project, a_clips, b_clips):
    """Create timelines with A/B cam clips synced by audio."""
    mp = project.GetMediaPool()

    timelines = []

    # Pair clips by index (assuming same shooting order)
    pairs = min(len(a_clips), len(b_clips))

    for i in range(pairs):
        a_clip = a_clips[i]
        b_clip = b_clips[i]

        clip_name = a_clip.GetName().rsplit(".", 1)[0]
        tl_name = f"{i+1:02d}_{clip_name}"

        log(f"タイムライン作成: {tl_name}")

        # Create timeline with A-cam
        mp.SetCurrentFolder(mp.GetRootFolder())
        timeline = mp.CreateTimelineFromClips(tl_name, [a_clip, b_clip])

        if timeline is None:
            # Fallback: create empty timeline and add clips
            timeline = mp.CreateEmptyTimeline(tl_name)
            if timeline:
                mp.AppendToTimeline([a_clip])
                # Add B-cam to track 2
                mp.AppendToTimeline([b_clip])

        if timeline:
            timelines.append(timeline)
            log(f"  → A/Bカメ追加完了")
        else:
            warn(f"  → タイムライン作成失敗: {tl_name}")

    # Also create individual timelines for single-angle exports
    for i, clip in enumerate(a_clips):
        name = clip.GetName().rsplit(".", 1)[0]
        tl = mp.CreateTimelineFromClips(f"front_{name}", [clip])
        if tl:
            timelines.append(tl)

    for i, clip in enumerate(b_clips):
        name = clip.GetName().rsplit(".", 1)[0]
        tl = mp.CreateTimelineFromClips(f"side_{name}", [clip])
        if tl:
            timelines.append(tl)

    return timelines


def apply_lut(project, timelines):
    """Apply Apple Log to Rec.709 LUT to all clips."""
    log("LUT 適用中...")

    for timeline in timelines:
        project.SetCurrentTimeline(timeline)
        clips = timeline.GetItemListInTrack("video", 1)

        if clips:
            for clip in clips:
                # Apply LUT via node
                clip.SetLUT(1, LUT_NAME)

        # Track 2 (B-cam if exists)
        clips_t2 = timeline.GetItemListInTrack("video", 2)
        if clips_t2:
            for clip in clips_t2:
                clip.SetLUT(1, LUT_NAME)

    log(f"LUT 適用完了: {LUT_NAME}")


def setup_render(project, timelines, export_dir):
    """Add all timelines to render queue."""
    log("レンダリング設定中...")

    project.LoadRenderPreset(RENDER_PRESET)

    render_settings = {
        "TargetDir": export_dir,
        "FormatWidth": RENDER_WIDTH,
        "FormatHeight": RENDER_HEIGHT,
        "FrameRate": RENDER_FPS,
        "VideoCodec": "H.264",
        "AudioCodec": "aac",
        "AudioBitDepth": 24,
        "AudioSampleRate": 48000,
        "FileExtension": "mp4",
    }

    for timeline in timelines:
        project.SetCurrentTimeline(timeline)
        project.SetRenderSettings(render_settings)
        project.AddRenderJob()
        log(f"  キュー追加: {timeline.GetName()}")

    return len(timelines)


def main():
    if len(sys.argv) < 2:
        print("使い方: python3 scripts/process-davinci.py ~/footage/2026-03-16")
        sys.exit(1)

    footage_dir = os.path.expanduser(sys.argv[1])
    a_cam_dir = os.path.join(footage_dir, "A-cam")
    b_cam_dir = os.path.join(footage_dir, "B-cam")
    export_dir = os.path.join(footage_dir, "export")
    os.makedirs(export_dir, exist_ok=True)

    date_str = os.path.basename(footage_dir)
    project_name = f"TheStandard_{date_str}"

    print(f"\n\033[1m\033[0;36m━━━ The Standard — DaVinci Resolve 自動処理 ━━━\033[0m\n")
    log(f"フッテージ: {footage_dir}")
    log(f"出力先: {export_dir}")

    # Find video files
    a_files = find_videos(a_cam_dir)
    b_files = find_videos(b_cam_dir)

    log(f"A-cam: {len(a_files)}本")
    log(f"B-cam: {len(b_files)}本")

    if not a_files and not b_files:
        err("動画ファイルが見つかりません")
        sys.exit(1)

    # Connect to DaVinci Resolve
    print(f"\n\033[1m\033[0;36m━━━ DaVinci Resolve 接続 ━━━\033[0m\n")
    resolve = connect_resolve()
    log(f"接続成功: DaVinci Resolve")

    # Create project
    print(f"\n\033[1m\033[0;36m━━━ プロジェクト作成 ━━━\033[0m\n")
    project = create_project(resolve, project_name)

    # Import media
    print(f"\n\033[1m\033[0;36m━━━ メディアインポート ━━━\033[0m\n")
    a_clips, b_clips = import_media(project, a_files, b_files)

    # Create timelines
    print(f"\n\033[1m\033[0;36m━━━ タイムライン作成 + 同期 ━━━\033[0m\n")
    timelines = create_synced_timelines(project, a_clips, b_clips)

    if not timelines:
        err("タイムラインの作成に失敗しました")
        sys.exit(1)

    # Apply LUT
    print(f"\n\033[1m\033[0;36m━━━ カラーグレーディング (LUT) ━━━\033[0m\n")
    try:
        apply_lut(project, timelines)
    except Exception as e:
        warn(f"LUT 自動適用失敗: {e}")
        warn("DaVinci のカラーページで手動適用してください")

    # Setup render
    print(f"\n\033[1m\033[0;36m━━━ レンダリング ━━━\033[0m\n")
    job_count = setup_render(project, timelines, export_dir)
    log(f"レンダーキュー: {job_count}ジョブ")

    # Start rendering
    log("レンダリング開始...")
    project.StartRendering()
    log("バックグラウンドでレンダリング中...")

    # Summary
    print(f"\n\033[1m\033[0;36m━━━ 完了 ━━━\033[0m\n")
    log(f"プロジェクト: {project_name}")
    log(f"タイムライン: {len(timelines)}本")
    log(f"出力先: {export_dir}")
    print()
    log("レンダリング完了後:")
    print("  1. export/ フォルダの動画を確認")
    print("  2. Bunny.net にアップロード")
    print("  3. src/data/videos.ts 更新 → fly deploy")


if __name__ == "__main__":
    main()

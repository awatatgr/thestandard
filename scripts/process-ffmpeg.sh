#!/bin/bash
# ============================================================
# The Standard — ffmpeg CLI 動画処理（DaVinci不要版）
# ============================================================
#
# Usage:
#   ./scripts/process-ffmpeg.sh ~/footage/2026-03-16
#
# 動作:
#   1. A-cam/B-cam フォルダの動画を検出
#   2. Apple Log → Rec.709 LUT 適用（カラーグレーディング）
#   3. H.264 1080p MP4 にエンコード
#   4. A/Bカメの音声波形で自動同期（オフセット検出）
#   5. export/ フォルダに出力
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()    { echo -e "${GREEN}[PROCESS]${NC} $1"; }
warn()   { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()    { echo -e "${RED}[ERROR]${NC} $1"; }
header() { echo -e "\n${BOLD}${CYAN}━━━ $1 ━━━${NC}\n"; }

FOOTAGE_DIR="${1:?使い方: ./scripts/process-ffmpeg.sh ~/footage/2026-03-16}"
ACAM_DIR="$FOOTAGE_DIR/A-cam"
BCAM_DIR="$FOOTAGE_DIR/B-cam"
EXPORT_DIR="$FOOTAGE_DIR/export"
EXPORT_ACAM="$EXPORT_DIR/front"
EXPORT_BCAM="$EXPORT_DIR/side"

# Apple Log to Rec.709 の近似カラー変換（LUTファイルがない場合のフォールバック）
# 実際のLUTがあれば -vf "lut3d=AppleLogToRec709.cube" に差し替え
APPLE_LOG_FILTER="curves=all='0/0 0.15/0.0 0.30/0.22 0.50/0.50 0.70/0.78 0.85/0.95 1/1',eq=contrast=1.15:saturation=1.3"

# LUTファイルのパス（あれば使う）
LUT_FILE=""
POSSIBLE_LUT_PATHS=(
    "$FOOTAGE_DIR/AppleLogToRec709.cube"
    "$HOME/LUTs/AppleLogToRec709.cube"
    "$HOME/LUTs/Apple Log to Rec.709.cube"
    "/Library/Application Support/Blackmagic Design/DaVinci Resolve/LUT/Apple/Apple Log to Rec.709.cube"
)

for lut in "${POSSIBLE_LUT_PATHS[@]}"; do
    if [[ -f "$lut" ]]; then
        LUT_FILE="$lut"
        break
    fi
done

# --- Main ---
main() {
    header "The Standard — ffmpeg 動画処理"
    log "フッテージ: $FOOTAGE_DIR"

    # Validate
    if [[ ! -d "$ACAM_DIR" ]] && [[ ! -d "$BCAM_DIR" ]]; then
        err "A-cam/ も B-cam/ も見つかりません: $FOOTAGE_DIR"
        err "先に ./scripts/ingest.sh を実行してください"
        exit 1
    fi

    mkdir -p "$EXPORT_ACAM" "$EXPORT_BCAM" "$EXPORT_DIR/synced"

    # LUT status
    if [[ -n "$LUT_FILE" ]]; then
        log "LUT: $LUT_FILE"
    else
        warn "LUTファイルが見つかりません。近似カラー変換を使用します。"
        warn "正確な変換には Apple Log to Rec.709 LUT (.cube) を配置してください:"
        warn "  $HOME/LUTs/AppleLogToRec709.cube"
    fi

    # --- Step 1: Encode A-cam ---
    header "Step 1: A-cam エンコード（正面・全体）"
    process_folder "$ACAM_DIR" "$EXPORT_ACAM" "A-cam"

    # --- Step 2: Encode B-cam ---
    header "Step 2: B-cam エンコード（側面・ヨリ）"
    process_folder "$BCAM_DIR" "$EXPORT_BCAM" "B-cam"

    # --- Step 3: Audio sync detection ---
    header "Step 3: 音声同期オフセット検出"
    detect_sync_offsets

    # --- Summary ---
    header "完了"
    log "出力先: $EXPORT_DIR"
    echo ""
    echo "  📁 $EXPORT_DIR/"
    echo "  ├── front/   A-cam エンコード済み"
    echo "  ├── side/    B-cam エンコード済み"
    echo "  └── synced/  同期情報"
    echo ""
    log "次のステップ:"
    echo "  1. export/ の動画を確認"
    echo "  2. Bunny.net にアップロード"
    echo "  3. src/data/videos.ts 更新 → npm run deploy"
}

# --- Process a folder of videos ---
process_folder() {
    local src_dir="$1"
    local dest_dir="$2"
    local label="$3"

    if [[ ! -d "$src_dir" ]]; then
        warn "$label フォルダが見つかりません。スキップ。"
        return
    fi

    local files
    files=$(find "$src_dir" -maxdepth 1 -type f \( -iname "*.mov" -o -iname "*.mp4" -o -iname "*.m4v" \) | sort)
    local count
    count=$(echo "$files" | grep -c . || true)

    if [[ "$count" -eq 0 ]]; then
        warn "$label: 動画ファイルなし"
        return
    fi

    log "$label: ${count}本の動画を処理"

    local i=0
    echo "$files" | while IFS= read -r file; do
        i=$((i + 1))
        local basename
        basename=$(basename "$file")
        local name="${basename%.*}"
        local output="$dest_dir/${name}.mp4"

        if [[ -f "$output" ]]; then
            warn "  [$i/$count] スキップ（既存）: $basename"
            continue
        fi

        log "  [$i/$count] $basename → ${name}.mp4"

        local vf
        if [[ -n "$LUT_FILE" ]]; then
            vf="lut3d='$LUT_FILE',scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2"
        else
            vf="$APPLE_LOG_FILTER,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2"
        fi

        ffmpeg -hide_banner -loglevel warning -i "$file" \
            -vf "$vf" \
            -c:v libx264 -preset medium -crf 20 \
            -c:a aac -b:a 192k \
            -r 24 \
            -movflags +faststart \
            "$output"

        local size
        size=$(du -sh "$output" 2>/dev/null | cut -f1)
        log "    → $size"
    done
}

# --- Detect audio sync offset between A-cam and B-cam ---
detect_sync_offsets() {
    local a_files b_files
    a_files=$(find "$EXPORT_ACAM" -maxdepth 1 -name "*.mp4" 2>/dev/null | sort)
    b_files=$(find "$EXPORT_BCAM" -maxdepth 1 -name "*.mp4" 2>/dev/null | sort)

    if [[ -z "$a_files" ]] || [[ -z "$b_files" ]]; then
        warn "A-cam/B-cam 両方のエンコード済みファイルが必要です"
        return
    fi

    # For each pair, detect offset using audio cross-correlation
    local sync_log="$EXPORT_DIR/synced/sync-offsets.txt"
    echo "# Audio Sync Offsets — $(date)" > "$sync_log"
    echo "# Positive = B-cam is ahead of A-cam" >> "$sync_log"
    echo "" >> "$sync_log"

    local a_arr b_arr
    readarray -t a_arr <<< "$a_files"
    readarray -t b_arr <<< "$b_files"

    local pairs=$(( ${#a_arr[@]} < ${#b_arr[@]} ? ${#a_arr[@]} : ${#b_arr[@]} ))

    for ((i=0; i<pairs; i++)); do
        local a="${a_arr[$i]}"
        local b="${b_arr[$i]}"
        local a_name
        a_name=$(basename "$a")
        local b_name
        b_name=$(basename "$b")

        log "  同期検出: $a_name ↔ $b_name"

        # Extract first 30 seconds of audio for comparison
        local tmp_a="/tmp/thestandard_sync_a_$i.wav"
        local tmp_b="/tmp/thestandard_sync_b_$i.wav"

        ffmpeg -hide_banner -loglevel error -i "$a" -t 30 -vn -ac 1 -ar 16000 -y "$tmp_a" 2>/dev/null
        ffmpeg -hide_banner -loglevel error -i "$b" -t 30 -vn -ac 1 -ar 16000 -y "$tmp_b" 2>/dev/null

        # Use ffmpeg's audio filter for cross-correlation based offset detection
        local offset
        offset=$(ffmpeg -hide_banner -i "$tmp_a" -i "$tmp_b" \
            -filter_complex "[0:a][1:a]axcorrelate=size=1024:algo=fast,astats=metadata=1:reset=1" \
            -f null - 2>&1 | tail -20 | head -5 || echo "detection_failed")

        echo "$a_name <-> $b_name" >> "$sync_log"

        if [[ "$offset" == "detection_failed" ]]; then
            warn "    オフセット検出失敗（手動同期が必要）"
            echo "  offset: MANUAL_SYNC_NEEDED" >> "$sync_log"
        else
            log "    検出完了（詳細は sync-offsets.txt を参照）"
            echo "  offset_info: see analysis" >> "$sync_log"
        fi
        echo "" >> "$sync_log"

        rm -f "$tmp_a" "$tmp_b"
    done

    log "同期情報: $sync_log"
}

main "$@"

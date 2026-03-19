#!/bin/bash
# ============================================================
# The Standard — Auto Ingest Script
# SSD接続 → カメラ自動判別 → フォルダ整理 → バックアップ
# ============================================================
#
# Usage:
#   ./scripts/ingest.sh                     # 自動検出
#   ./scripts/ingest.sh /Volumes/SSD_A /Volumes/SSD_B   # 手動指定
#
# 動作:
#   1. /Volumes/ から外付けドライブを自動検出
#   2. 動画ファイルのメタデータからカメラモデルを判別
#      - iPhone 15 Pro Max → A-cam (全体)
#      - iPhone 16 Pro     → B-cam (ヨリ)
#   3. ~/footage/YYYY-MM-DD/{A-cam,B-cam}/ に整理してコピー
#   4. コピー完了後、ファイル数とサイズのサマリー表示
# ============================================================

set -euo pipefail

# --- Config ---
FOOTAGE_BASE="${FOOTAGE_BASE:-$HOME/footage}"
TODAY=$(date +%Y-%m-%d)
DEST_DIR="$FOOTAGE_BASE/$TODAY"
VIDEO_EXTENSIONS="mov|mp4|MOV|MP4|m4v|M4V"

# Camera model mapping
ACAM_MODEL="iPhone 15 Pro Max"
BCAM_MODEL="iPhone 16 Pro"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "${GREEN}[INGEST]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }
header() { echo -e "\n${BOLD}${CYAN}━━━ $1 ━━━${NC}\n"; }

# --- Find external volumes ---
find_external_volumes() {
    local volumes=()
    for vol in /Volumes/*/; do
        vol="${vol%/}"
        # Skip the main disk
        [[ "$vol" == "/Volumes/Macintosh HD" ]] && continue
        [[ "$vol" == "/Volumes/Macintosh HD - Data" ]] && continue
        # Check if it has video files
        if find "$vol" -maxdepth 3 -type f -iregex ".*\.\(${VIDEO_EXTENSIONS}\)" -print -quit 2>/dev/null | grep -q .; then
            volumes+=("$vol")
        fi
    done
    echo "${volumes[@]}"
}

# --- Detect camera model from a video file ---
detect_camera_model() {
    local file="$1"
    # Try ffprobe first (most reliable for ProRes)
    local model
    model=$(ffprobe -v quiet -show_entries format_tags=com.apple.quicktime.model \
        -of default=noprint_wrappers=1:nokey=1 "$file" 2>/dev/null || true)

    if [[ -z "$model" ]]; then
        # Fallback: try mdls (macOS Spotlight metadata)
        model=$(mdls -name kMDItemAcquisitionModel "$file" 2>/dev/null \
            | sed 's/kMDItemAcquisitionModel = "//' | sed 's/"//' || true)
    fi

    if [[ -z "$model" || "$model" == "(null)" ]]; then
        # Last resort: ffprobe make tag
        model=$(ffprobe -v quiet -show_entries format_tags=com.apple.quicktime.make \
            -of default=noprint_wrappers=1:nokey=1 "$file" 2>/dev/null || true)
    fi

    echo "$model"
}

# --- Classify volume as A-cam or B-cam ---
classify_volume() {
    local vol="$1"
    # Sample the first video file found
    local sample_file
    sample_file=$(find "$vol" -maxdepth 3 -type f -iregex ".*\.\(${VIDEO_EXTENSIONS}\)" -print -quit 2>/dev/null)

    if [[ -z "$sample_file" ]]; then
        echo "unknown"
        return
    fi

    local model
    model=$(detect_camera_model "$sample_file")

    if [[ "$model" == *"15 Pro Max"* ]]; then
        echo "A-cam"
    elif [[ "$model" == *"16 Pro"* ]]; then
        echo "B-cam"
    elif [[ "$model" == *"15 Pro"* ]]; then
        echo "A-cam"
    elif [[ "$model" == *"16"* ]]; then
        echo "B-cam"
    else
        echo "unknown:$model"
    fi
}

# --- Copy files with progress ---
copy_with_progress() {
    local src_dir="$1"
    local dest_dir="$2"
    local label="$3"

    mkdir -p "$dest_dir"

    local files
    files=$(find "$src_dir" -maxdepth 3 -type f -iregex ".*\.\(${VIDEO_EXTENSIONS}\)" 2>/dev/null)
    local count
    count=$(echo "$files" | grep -c . || true)

    if [[ "$count" -eq 0 ]]; then
        warn "  $label: 動画ファイルが見つかりません"
        return
    fi

    log "  $label: ${count}本の動画をコピー中..."

    local i=0
    echo "$files" | while IFS= read -r file; do
        i=$((i + 1))
        local basename
        basename=$(basename "$file")
        local size
        size=$(du -sh "$file" 2>/dev/null | cut -f1)
        printf "    [%d/%d] %s (%s)\n" "$i" "$count" "$basename" "$size"
        cp "$file" "$dest_dir/"
    done

    # Summary
    local total_size
    total_size=$(du -sh "$dest_dir" 2>/dev/null | cut -f1)
    log "  $label: 完了 (${count}本, ${total_size})"
}

# --- Main ---
main() {
    header "The Standard — Auto Ingest"
    log "日付: $TODAY"
    log "出力先: $DEST_DIR"
    echo ""

    # Determine source volumes
    local volumes=()
    if [[ $# -ge 1 ]]; then
        # Manual specification
        volumes=("$@")
        log "手動指定モード: ${volumes[*]}"
    else
        # Auto-detect
        log "外付けドライブを検出中..."
        IFS=' ' read -ra volumes <<< "$(find_external_volumes)"

        if [[ ${#volumes[@]} -eq 0 ]]; then
            err "外付けドライブが見つかりません"
            err "SSDを接続してから再実行してください"
            echo ""
            echo "  手動指定も可能です:"
            echo "  ./scripts/ingest.sh /Volumes/SSD名1 /Volumes/SSD名2"
            exit 1
        fi

        log "検出: ${#volumes[@]}台のドライブ"
        for vol in "${volumes[@]}"; do
            echo "    - $vol"
        done
    fi
    echo ""

    # Classify each volume
    header "カメラ判別"

    declare -A cam_map
    local unclassified=()

    for vol in "${volumes[@]}"; do
        local cam
        cam=$(classify_volume "$vol")

        if [[ "$cam" == "A-cam" ]]; then
            log "📹 ${vol} → ${BOLD}A-cam${NC} (iPhone 15 Pro Max / 全体)"
            cam_map["A-cam"]="$vol"
        elif [[ "$cam" == "B-cam" ]]; then
            log "📹 ${vol} → ${BOLD}B-cam${NC} (iPhone 16 Pro / ヨリ)"
            cam_map["B-cam"]="$vol"
        else
            local model="${cam#unknown:}"
            warn "📹 ${vol} → 不明なカメラ (${model:-メタデータなし})"
            unclassified+=("$vol")
        fi
    done

    # Handle unclassified volumes
    if [[ ${#unclassified[@]} -gt 0 ]]; then
        echo ""
        for vol in "${unclassified[@]}"; do
            echo -n "  ${vol} をどちらに割り当てますか？ [A/B/skip]: "
            read -r choice
            case "$choice" in
                [aA]*) cam_map["A-cam"]="$vol"; log "  → A-cam に割り当て" ;;
                [bB]*) cam_map["B-cam"]="$vol"; log "  → B-cam に割り当て" ;;
                *) warn "  → スキップ" ;;
            esac
        done
    fi

    echo ""

    # Create destination directories
    header "データ転送"
    mkdir -p "$DEST_DIR"/{A-cam,B-cam,audio}

    # Copy files
    if [[ -n "${cam_map[A-cam]:-}" ]]; then
        copy_with_progress "${cam_map[A-cam]}" "$DEST_DIR/A-cam" "A-cam"
    else
        warn "A-cam のソースがありません"
    fi

    echo ""

    if [[ -n "${cam_map[B-cam]:-}" ]]; then
        copy_with_progress "${cam_map[B-cam]}" "$DEST_DIR/B-cam" "B-cam"
    else
        warn "B-cam のソースがありません"
    fi

    # Create shooting log template
    header "撮影ログ作成"
    local log_file="$DEST_DIR/shooting-log.md"
    if [[ ! -f "$log_file" ]]; then
        cat > "$log_file" << EOF
# 撮影ログ: $TODAY

## ファイル一覧

### A-cam (全体)
$(ls -1 "$DEST_DIR/A-cam/" 2>/dev/null | sed 's/^/- /' || echo "- (なし)")

### B-cam (ヨリ)
$(ls -1 "$DEST_DIR/B-cam/" 2>/dev/null | sed 's/^/- /' || echo "- (なし)")

## テイクログ

| # | エクササイズ | テイク | OK/NG | Bカメ位置 | メモ |
|---|------------|--------|-------|----------|------|
| 1 |            |        |       |          |      |
| 2 |            |        |       |          |      |
| 3 |            |        |       |          |      |
| 4 |            |        |       |          |      |
| 5 |            |        |       |          |      |
| 6 |            |        |       |          |      |
| 7 |            |        |       |          |      |
| 8 |            |        |       |          |      |
| 9 |            |        |       |          |      |
| 10|            |        |       |          |      |
EOF
        log "撮影ログテンプレート作成: $log_file"
    fi

    # Summary
    header "完了サマリー"

    local a_count b_count
    a_count=$(find "$DEST_DIR/A-cam" -type f 2>/dev/null | wc -l | tr -d ' ')
    b_count=$(find "$DEST_DIR/B-cam" -type f 2>/dev/null | wc -l | tr -d ' ')
    local total_size
    total_size=$(du -sh "$DEST_DIR" 2>/dev/null | cut -f1)

    echo "  📁 $DEST_DIR"
    echo "  ├── A-cam/  ${a_count}本"
    echo "  ├── B-cam/  ${b_count}本"
    echo "  └── shooting-log.md"
    echo ""
    echo "  合計サイズ: ${total_size}"
    echo ""

    log "${BOLD}次のステップ:${NC}"
    echo "  1. shooting-log.md を編集してテイクログを記入"
    echo "  2. バックアップ: cp -r $DEST_DIR /path/to/backup/"
    echo "  3. DaVinci Resolve で A/Bカメ同期 + LUT適用 + エンコード"
    echo "  4. Bunny.net にアップロード → Stream ID 取得"
    echo "  5. src/data/videos.ts 更新 → npm run deploy"
}

main "$@"

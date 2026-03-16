#!/bin/bash
# Batch encode all footage to 1080p H.264
set -euo pipefail

FOOTAGE_DIR="${1:?Usage: encode-batch.sh ~/footage/2026-03-16}"
ACAM_DIR="$FOOTAGE_DIR/A-cam"
BCAM_DIR="$FOOTAGE_DIR/B-cam"
EXPORT_FRONT="$FOOTAGE_DIR/export/front"
EXPORT_SIDE="$FOOTAGE_DIR/export/side"

mkdir -p "$EXPORT_FRONT" "$EXPORT_SIDE"

# Color correction filter for Apple Log-like footage
# Approximate Rec.709 conversion — safe even on non-Log footage
COLOR_FILTER="curves=all='0/0 0.15/0.0 0.30/0.22 0.50/0.50 0.70/0.78 0.85/0.95 1/1',eq=contrast=1.1:saturation=1.2"
SCALE_FILTER="scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2"

encode_file() {
    local input="$1"
    local output="$2"
    local label="$3"
    local basename
    basename=$(basename "$input")

    if [[ -f "$output" ]]; then
        echo "[SKIP] $label: $basename (already exists)"
        return
    fi

    echo "[ENCODE] $label: $basename → $(basename "$output")"
    ffmpeg -hide_banner -loglevel warning -stats \
        -i "$input" \
        -vf "$COLOR_FILTER,$SCALE_FILTER" \
        -c:v libx264 -preset medium -crf 20 \
        -c:a aac -b:a 192k \
        -r 24 \
        -movflags +faststart \
        "$output"

    local size
    size=$(du -sh "$output" 2>/dev/null | cut -f1)
    echo "[DONE]  $label: $(basename "$output") ($size)"
}

TOTAL=0
DONE=0

# Count total files
for f in "$ACAM_DIR"/*.mov "$BCAM_DIR"/*.mov; do
    [[ -f "$f" ]] && TOTAL=$((TOTAL + 1))
done

echo ""
echo "━━━ The Standard — Batch Encode ━━━"
echo "  入力: $FOOTAGE_DIR"
echo "  合計: ${TOTAL}本"
echo "  出力: 1080p H.264 MP4"
echo ""

# Encode A-cam
echo "━━━ A-cam (正面) ━━━"
for f in "$ACAM_DIR"/*.mov; do
    [[ -f "$f" ]] || continue
    name=$(basename "$f" .mov)
    encode_file "$f" "$EXPORT_FRONT/${name}.mp4" "A-cam"
    DONE=$((DONE + 1))
    echo "  進捗: ${DONE}/${TOTAL}"
    echo ""
done

# Encode B-cam
echo "━━━ B-cam (側面) ━━━"
for f in "$BCAM_DIR"/*.mov; do
    [[ -f "$f" ]] || continue
    name=$(basename "$f" .mov)
    encode_file "$f" "$EXPORT_SIDE/${name}.mp4" "B-cam"
    DONE=$((DONE + 1))
    echo "  進捗: ${DONE}/${TOTAL}"
    echo ""
done

echo "━━━ 完了 ━━━"
echo "  A-cam: $(ls "$EXPORT_FRONT"/*.mp4 2>/dev/null | wc -l | tr -d ' ')本"
echo "  B-cam: $(ls "$EXPORT_SIDE"/*.mp4 2>/dev/null | wc -l | tr -d ' ')本"
du -sh "$EXPORT_FRONT" "$EXPORT_SIDE" "$FOOTAGE_DIR/export"
echo ""
echo "次のステップ:"
echo "  1. export/ の動画を確認"
echo "  2. Bunny.net にアップロード"
echo "  3. src/data/videos.ts 更新 → make deploy"

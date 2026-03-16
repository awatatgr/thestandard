#!/bin/bash
# Bunny.net Stream に動画をアップロードするスクリプト
set -euo pipefail

LIBRARY_ID="YOUR_LIBRARY_ID"
API_KEY="REDACTED_API_KEY"
CDN_HOSTNAME="vz-xxx.b-cdn.net"

upload_video() {
    local file="$1"
    local title="$2"

    echo "[UPLOAD] $title"
    echo "  ファイル: $(basename "$file") ($(du -sh "$file" | cut -f1))"

    # Step 1: Create video entry
    local response
    response=$(curl -s -X POST "https://video.bunnycdn.com/library/${LIBRARY_ID}/videos" \
        -H "AccessKey: ${API_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"title\":\"${title}\"}")

    local video_id
    video_id=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin)['guid'])")

    echo "  Video ID: $video_id"

    # Step 2: Upload file
    echo "  アップロード中..."
    local http_code
    http_code=$(curl -s -w "%{http_code}" -o /dev/null -X PUT \
        "https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${video_id}" \
        -H "AccessKey: ${API_KEY}" \
        -H "Content-Type: application/octet-stream" \
        --data-binary "@${file}")

    if [ "$http_code" = "200" ]; then
        echo "  ✅ 完了！"
        echo "  HLS: https://${CDN_HOSTNAME}/${video_id}/playlist.m3u8"
        echo "  Thumb: https://${CDN_HOSTNAME}/${video_id}/thumbnail.jpg"
    else
        echo "  ❌ 失敗 (HTTP $http_code)"
    fi

    echo "$video_id"
}

# Usage: ./scripts/bunny-upload.sh <file> <title>
if [ $# -ge 2 ]; then
    upload_video "$1" "$2"
fi

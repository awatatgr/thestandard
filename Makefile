# The Standard — CLI ワークフロー
# ================================

DATE ?= $(shell date +%Y-%m-%d)
FOOTAGE ?= $(HOME)/footage/$(DATE)
FLY := $(HOME)/.fly/bin/flyctl

# --- 撮影後の全自動パイプライン ---

# Step 1: SSD → PC (カメラ自動判別)
ingest:
	./scripts/ingest.sh

# Step 2: LUT適用 + エンコード (ffmpeg版、DaVinci不要)
process:
	./scripts/process-ffmpeg.sh $(FOOTAGE)

# Step 3: DaVinci版 (DaVinciが起動している状態で)
process-davinci:
	python3 ./scripts/process-davinci.py $(FOOTAGE)

# Step 4: ビルド + デプロイ
deploy:
	npm run build
	$(FLY) deploy

# --- ワンコマンド ---

# SSD挿す → エンコード → デプロイ (Bunny.netアップロードは手動)
all: ingest process
	@echo ""
	@echo "━━━ 次のステップ ━━━"
	@echo "1. $(FOOTAGE)/export/ の動画を Bunny.net にアップロード"
	@echo "2. src/data/videos.ts に Stream ID を追加"
	@echo "3. make deploy"

# --- 開発 ---

dev:
	npm run dev

build:
	npm run build

typecheck:
	npx tsc --noEmit

.PHONY: ingest process process-davinci deploy all dev build typecheck

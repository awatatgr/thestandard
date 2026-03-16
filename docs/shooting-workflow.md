# The Standard — 撮影ワークフロー

トレーナーメソッドのトレーニング/実技撮影の完全ガイド。

---

## 1. 機材チェックリスト

### Aカメ: iPhone 15 Pro Max (256GB) — 全体像（The Context）
- [ ] バッテリー満充電（80%以上）
- [ ] ストレージ空き確認（ProRes 4K: 約6GB/分）
- [ ] SmallRig ビデオケージ装着
- [ ] Crucial X9 Pro 1TB SSD 接続 & 認識確認
- [ ] SmallRig SSDブラケット (BSH2343) で固定
- [ ] K&F Concept 52mm 可変NDフィルター + スマホクリップ装着
- [ ] Ulanzi トラベル三脚セット（胸の高さ）
- [ ] 録画設定: Apple ProRes Log / 4K / 24fps

### Bカメ: iPhone 16 Pro (256GB) — 局所・ヨリ（The Detail）
- [ ] バッテリー満充電（80%以上）
- [ ] ストレージ空き確認
- [ ] SmallRig ビデオケージ装着
- [ ] Crucial X9 Pro 1TB SSD 接続 & 認識確認
- [ ] SmallRig SSDブラケットで固定
- [ ] Ulanzi MT-44 ミニ三脚セット（ローアングル特化）
- [ ] 録画設定: Apple ProRes Log / 4K / 24fps

### 司令塔: iPad Pro 11" (M5)
- [ ] Blackmagic Camera アプリインストール & 設定確認
- [ ] Wi-Fi で A/Bカメ接続テスト
- [ ] タイムコード同期テスト（一斉録画）
- [ ] 金属製タブレットマウントセット
- [ ] バッテリー充電

### 音声
- [ ] ピンマイク動作確認（トレーナー用）
- [ ] 音声レベルテスト（録画して再生確認）
- [ ] 予備バッテリー/ケーブル

### その他
- [ ] USB-C ケーブル（短い L字/U字タイプ）× 2
- [ ] 予備充電器/モバイルバッテリー
- [ ] ショットリスト印刷 or iPad表示

---

## 2. 撮影当日のタイムライン

```
━━━ 到着・ロケハン ━━━
  □ 撮影場所の照明確認
  □ スペース確認（動きの撮影に十分な広さ）
  □ 背景のチェック（余計な物の排除）
  □ 電源の確認

━━━ セットアップ (30min) ━━━
  □ Aカメ: 三脚設置 → 全身が収まるフレーミング
    - トレーナーの全身 + 上下左右にマージン
    - 水平確認
  □ Bカメ: ローアングル設置 → 関節・足元のヨリ
    - 膝下〜足元がメインフレーム
    - MT-44ミニ三脚で安定させる
  □ iPad: Blackmagic Camera で A/Bカメ接続
    - タイムコード同期確認
    - プレビュー画面でフレーミング最終確認
  □ NDフィルター調整（屋外時）
    - シャッタースピード 1/48（24fps × 2）に固定
    - NDで露出調整 → 滑らかなモーションブラー
  □ テスト録画 → 即再生確認
    - ProRes Log の色味確認（白っぽくて正常）
    - 音声レベル確認
    - ピント確認

━━━ 本撮影 ━━━
  □ メニューごとにスレート
    「シーン○、テイク○」を声で入れる
  □ 撮影の進め方（各メニュー）:
    1. トレーナーに概要を説明してもらう
    2. NG例の実演（一般人がやりがちな間違い）
    3. 正解の実演（正しいフォーム）
    4. プロデューサーから質問を投げかけ:
       「今、足の裏のどこに重心がありますか？」
       「膝の角度は何度くらいを意識していますか？」
       → 無意識の動きをその場で言語化させる
    5. クローズアップ指示:
       Bカメのアングルを変更して再度実演
  □ テイクログ記録（メモ/iPad）
    - テイク番号、良/NG、特記事項
  □ メニュー間でBカメのアングル変更

━━━ 休憩 ━━━
  □ SSD残量確認
  □ バッテリー残量確認
  □ テイクログの振り返り

━━━ 片付け ━━━
  □ 最終テイクの録画停止確認
  □ SSD取り外し（安全に取り外し）
  □ 機材回収・梱包
```

---

## 3. 撮影ディレクション指針

### 3.1 NG例 → 正解例の対比（Before/After）
一般人がやりがちな**間違った動き（Before）**を先に実演させ、直後に**正しい動き（After）**を実演。視聴者が「自分の動き」と照合できる構成にする。

### 3.2 言語化の強制
- ダラダラした長回しは禁止
- テーマごとに細かくRECを回す
- 録画中にプロデューサーが質問を投げかけ:
  - 「今、どこの筋肉を使っていますか？」
  - 「足の裏のどこに重心がありますか？」
  - 「この動きと先ほどのNG例、何が違いますか？」
- トレーナーの無意識の神業を、その場で言語化させる

### 3.3 2眼レフの証明
- **Aカメ（全体）**: 姿勢全体のバランスを証明
- **Bカメ（ヨリ）**: 特定の関節・筋肉の動きを超接写で証明
- 言葉だけでなく、映像で視覚的に裏付ける

### 3.4 テーマごとの短尺撮影
- 1テーマ = 3-5分以内を目安
- 後の編集効率を最大化
- 視聴者の集中力を保つ構成

---

## 4. 撮影後パイプライン

### Step 1: データ転送 (撮影当日)
```bash
# Crucial X9 Pro (10Gbps USB-C) → PCへコピー
# SSD 2台分をそれぞれ転送
cp -r /Volumes/CRUCIAL_X9_A/* ~/footage/2026-03-16/A-cam/
cp -r /Volumes/CRUCIAL_X9_B/* ~/footage/2026-03-16/B-cam/
```
- 2台目のSSD or 外付けHDDにバックアップコピー
- オリジナルデータは最低2箇所に保存

### Step 2: フォルダ整理
```
footage/
└── 2026-03-16/
    ├── A-cam/                    # iPhone 15 Pro Max (全体)
    │   ├── squat_take01.mov
    │   ├── squat_take02.mov
    │   ├── walking_take01.mov
    │   └── ...
    ├── B-cam/                    # iPhone 16 Pro (ヨリ)
    │   ├── squat_closeup_take01.mov
    │   └── ...
    ├── audio/                    # 外部音声（あれば）
    └── shooting-log.md           # テイクログ
```

### Step 3: DaVinci Resolve 処理
1. **プロジェクト作成** — メディアプールにA/Bカメ素材をインポート
2. **A/Bカメ同期** — 音声波形 or タイムコードで自動同期
3. **カラーグレーディング** — Apple ProRes Log → Rec.709 LUT適用
   - LUTファイル: Apple公式 or DaVinci内蔵の「Apple Log to Rec.709」
4. **カット編集** — テーマごとにタイムラインを分けて編集
5. **エンコード** — H.264 MP4 出力
   - 編集済み: 1080p or 4K
   - 各アングル（正面/側面等）: 1080p

### Step 4: Bunny.net Stream にアップロード
1. [Bunny.net ダッシュボード](https://dash.bunny.net/) → Stream Library
2. 各アングルの動画をアップロード
3. 自動トランスコード完了を待つ（HLSアダプティブ配信対応）
4. 各動画の **Stream ID** をメモ

### Step 5: アプリ更新
`src/data/videos.ts` にエントリを追加:
```typescript
{
  id: "squat-basics",
  title: "正しいスクワットの基本",
  description: "重心の位置、膝の角度、背中のラインを徹底解説。",
  category: "method",
  chapter: "第1章: 基本動作",
  recordedAt: "2026-03-16",
  durationSeconds: 480,
  angles: [
    { id: "squat-edited", label: "編集済み", bunnyStreamId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
    { id: "squat-front",  label: "正面",     bunnyStreamId: "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy" },
    { id: "squat-side",   label: "左側",     bunnyStreamId: "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz" },
  ],
}
```

### Step 6: デプロイ
```bash
# 環境変数設定（初回のみ）
echo "VITE_BUNNY_CDN_HOSTNAME=your-cdn.b-cdn.net" > .env

# ビルド & デプロイ
npm run build
fly deploy
```

### Step 7: レビュー & 共有
- デプロイ完了後、URL（例: `https://thestandard.fly.dev`）を確認
- 各動画の再生テスト（シングルビュー & マルチビュー）
- モバイルでの表示確認
- 関係者にURLを共有

---

## 5. Bunny.net 設定メモ

| 項目 | 値 |
|------|-----|
| Stream Library | bunny.net ダッシュボードで作成 |
| HLS URL形式 | `https://{CDN_HOSTNAME}/{VIDEO_ID}/playlist.m3u8` |
| サムネイル | `https://{CDN_HOSTNAME}/{VIDEO_ID}/thumbnail.jpg` |
| 環境変数 | `VITE_BUNNY_CDN_HOSTNAME` |
| トランスコード | 自動（アップロード後数分で完了） |

---

## 6. テイクログテンプレート

```markdown
# 撮影ログ: 2026-03-16

## メニュー1: スクワット
| テイク | カメラ | 結果 | メモ |
|--------|--------|------|------|
| 01 | A+B | NG | 音声テスト |
| 02 | A+B | OK | 基本フォーム説明 |
| 03 | A+B | OK | NG例の実演 |
| 04 | A+B | OK | 正解の実演 + 質問 |
| 05 | B | OK | 膝のクローズアップ |

## メニュー2: 歩行分析
...
```

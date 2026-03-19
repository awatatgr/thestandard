/**
 * THE STANDARD — 手動 UAT ローダー (FirstLook SDK準拠)
 *
 * 使い方:
 *   1. npm run uat:manual でアプリ起動
 *   2. ブラウザのコンソールで以下を実行:
 *      const s=document.createElement('script');s.src='/uat-inject.js';document.head.appendChild(s);
 *   3. 右下にクエストオーバーレイが表示される
 *   4. 各クエストの手順に従い OK / 気になる / NG を判定
 *   5. 完了後、JSON レポートをダウンロード
 */
(function () {
  if (window.__uatLoaded) {
    console.warn("[UAT] Already loaded");
    return;
  }
  window.__uatLoaded = true;

  // Shadow DOM を open mode に強制
  var origAttach = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    return origAttach.call(this, Object.assign({}, init, { mode: "open" }));
  };

  // ============================================================
  // クエスト定義 — FirstLook Quest インターフェース準拠
  //   { id, title, description, order, blocking }
  //
  // VIEWER_QUESTS: UAT_VIEWER_v1.md Quest 1-10
  // ADMIN_QUESTS:  UAT_ADMIN_v1.md  ## 1-10
  // ============================================================

  var VIEWER_QUESTS = [
    {
      id: "VIEW-001",
      title: "認証・アクセス制御",
      description:
        "1. 未ログイン状態で / にアクセス → /login にリダイレクトされるか\n" +
        "2. /login でメールアドレスを入力し「ログインリンクを送信」をクリック\n" +
        "3. 確認画面（メールアイコン・「メールを確認」メッセージ）が表示されるか\n" +
        "4. 「別のメールアドレスを使う」リンクで入力画面に戻るか\n" +
        "5. 空メール・不正形式でバリデーションが効くか\n" +
        "6. ログイン済みで /login にアクセス → / にリダイレクトされるか\n" +
        "7. ユーザーメニューからログアウト → /login にリダイレクトされるか",
      order: 1,
      blocking: true,
    },
    {
      id: "VIEW-002",
      title: "動画一覧・ヒーローセクション",
      description:
        "1. / を開き、ヒーローにサムネイル・タイトル・カテゴリバッジ・再生時間・アングル数が表示されるか\n" +
        "2. ヒーローをクリック → /videos/stretch-full に遷移するか\n" +
        "3. グリッドに6枚の動画カード（サムネ・タイトル・バッジ・再生時間）が表示されるか\n" +
        "4. カードクリックで詳細ページに遷移するか\n" +
        "5. レスポンシブ: デスクトップ4列 / タブレット2列 / モバイル1列を確認\n" +
        "6. カードホバーで枠線の色変化・再生アイコンが表示されるか",
      order: 2,
      blocking: true,
    },
    {
      id: "VIEW-003",
      title: "カテゴリフィルター",
      description:
        "1. フィルターバーに「すべて」「トレーニング」「ドリル」「メソッド」「インタビュー」が並んでいるか\n" +
        "2. 「トレーニング」タップ → training動画のみ表示されるか\n" +
        "3. 「ドリル」タップ → drill動画のみ表示されるか\n" +
        "4. 「インタビュー」タップ → 「動画がありません」が表示されるか\n" +
        "5. 「すべて」タップ → 全件復帰するか\n" +
        "6. アクティブフィルターのボタンがプライマリカラーになるか\n" +
        "7. モバイルでフィルターバーが横スクロールできるか",
      order: 3,
      blocking: true,
    },
    {
      id: "VIEW-004",
      title: "シングルビュー再生・アングル切替",
      description:
        "1. /videos/stretch-full を開き、タイトル・レイアウトボタン・情報セクションが表示されるか\n" +
        "2. シングルビューに切り替え → アングルセレクタ（Front/Side）が表示されるか\n" +
        "3. 再生ボタンをクリック → HLS再生が開始されるか\n" +
        "4. 一時停止・シーク・スキップ(±10s)が動作するか\n" +
        "5. Front→Side アングル切替で再生位置が維持されるか\n" +
        "6. 音量スライダー・ミュート・フルスクリーンが動作するか\n" +
        "7. 存在しないID (/videos/nonexistent-id) で「動画が見つかりません」が表示されるか",
      order: 4,
      blocking: true,
    },
    {
      id: "VIEW-005",
      title: "マルチアングル同期再生",
      description:
        "1. stretch-full の均等レイアウト → 2パネルが同サイズで並ぶか\n" +
        "2. stretch-3view の均等レイアウト → 3パネルが3列で並ぶか\n" +
        "3. メイン+サブレイアウト → メインが大きく、サブが右側に小さく表示されるか\n" +
        "4. マスター再生/一時停止で全アングルが同時に動作するか\n" +
        "5. マスターシークで全アングルが同一位置にジャンプするか\n" +
        "6. SYNC インジケータが緑で表示されるか\n" +
        "7. Sync OFF→ON で再同期されるか\n" +
        "8. レイアウト切替で再生位置が維持されるか",
      order: 5,
      blocking: true,
    },
    {
      id: "VIEW-006",
      title: "チャプター・エクササイズオーバーレイ",
      description:
        "1. stretch-3view のサイドバーに「チャプター」タブとチャプター一覧(16件)が表示されるか\n" +
        "2. アクティブチャプターがプライマリカラーでハイライトされるか\n" +
        "3. チャプタークリックで全プレーヤーがその位置にシークするか\n" +
        "4. エクササイズオーバーレイに名前と進捗バッジ(例: 2/16)が表示されるか\n" +
        "5. 進捗ドットのクリックでシークするか\n" +
        "6. サイドバーの「動画一覧」タブに切替 → 全動画リストが表示されるか\n" +
        "7. モバイルでチャプターアコーディオンが開閉するか",
      order: 6,
      blocking: false,
    },
    {
      id: "VIEW-007",
      title: "字幕トグル",
      description:
        "1. stretch-full の詳細ページで字幕ボタン(CCアイコン)が表示されるか\n" +
        "2. running-form では字幕ボタンが非表示であるか\n" +
        "3. デフォルトで字幕ONか（ボタンがプライマリカラー）\n" +
        "4. 字幕OFFをタップ → 字幕テキストが消え、ボタンがグレーに変わるか\n" +
        "5. 再度ONをタップ → 字幕テキストが復帰するか\n" +
        "6. マルチビューではメインアングルに字幕が表示されるか",
      order: 7,
      blocking: false,
    },
    {
      id: "VIEW-008",
      title: "キーボードショートカット",
      description:
        "1. Space/K で再生/一時停止が切り替わるか\n" +
        "2. J で10秒巻き戻し、L で10秒早送りされるか\n" +
        "3. 左右矢印キーで5秒スキップされるか\n" +
        "4. F でフルスクリーン切替されるか\n" +
        "5. M でミュート切替されるか\n" +
        "6. , / . でフレーム単位コマ送り(シングルビュー)されるか\n" +
        "7. マルチビューでも Space/J/L/F が全アングルに適用されるか\n" +
        "8. input要素フォーカス中はショートカットが無効か",
      order: 8,
      blocking: false,
    },
    {
      id: "VIEW-009",
      title: "再生速度",
      description:
        "1. 速度ボタンに「1x」が表示されるか\n" +
        "2. クリックでメニュー(0.25x〜2x)が開くか\n" +
        "3. 0.5x を選択 → 実際にスロー再生されるか\n" +
        "4. 2x を選択 → 倍速再生されるか\n" +
        "5. アクティブな速度がメニュー内でハイライトされるか\n" +
        "6. マルチビューで速度変更が全アングルに適用されるか\n" +
        "7. シーク後も速度設定が維持されるか",
      order: 9,
      blocking: false,
    },
    {
      id: "VIEW-010",
      title: "モバイル・タッチ操作",
      description:
        "1. モバイルビュー(375px)で一覧ページが1列レイアウトになるか\n" +
        "2. 詳細ページでプレーヤーコントロールが表示されるか(タッチターゲット40px以上)\n" +
        "3. マルチビューでアングルタブ(Front/Side)が表示され、1つずつ切替できるか\n" +
        "4. 動画右半分ダブルタップで+10s、左半分で-10sスキップされるか\n" +
        "5. シングルタップでコントロール表示、3秒後に自動非表示されるか\n" +
        "6. プログレスバーのサムが24px(タッチ用)か\n" +
        "7. iOS Safari でインライン再生されるか(playsInline属性)",
      order: 10,
      blocking: false,
    },
  ];

  var ADMIN_QUESTS = [
    {
      id: "ADMIN-001",
      title: "認証・認可ガード",
      description:
        "1. adminロールでログイン後、/admin にアクセス → ダッシュボードが表示されるか\n" +
        "2. 未認証で /admin にアクセス → /login にリダイレクトされるか\n" +
        "3. viewerロールで /admin にアクセス → / にリダイレクトされるか\n" +
        "4. サイドバー「サイトに戻る」ボタンで / に遷移するか\n" +
        "5. サイドバー「動画管理」リンクで /admin/videos に遷移するか",
      order: 1,
      blocking: true,
    },
    {
      id: "ADMIN-002",
      title: "ダッシュボード KPI",
      description:
        "1. /admin のKPIカード「動画数」に正しい値(7)が表示されるか\n" +
        "2. 「総時間」に44分と表示されるか\n" +
        "3. 「カテゴリ」に3と表示されるか\n" +
        "4. 「公開中」に正しい公開数が表示されるか\n" +
        "5. 「最近の更新」セクションに最新5件が表示されるか\n" +
        "6. 最近の更新の動画クリックで編集ページに遷移するか\n" +
        "7. 「新規動画」ボタンで /admin/videos/new に遷移するか",
      order: 2,
      blocking: true,
    },
    {
      id: "ADMIN-003",
      title: "動画一覧管理",
      description:
        "1. /admin/videos に全動画(7件)が件数バッジ付きで表示されるか\n" +
        "2. 各動画にサムネイル・カテゴリバッジ・ステータスバッジが表示されるか\n" +
        "3. draft動画に「下書き」バッジ(グレー)が表示されるか\n" +
        "4. アングル数・再生時間・収録日が表示されるか\n" +
        "5. 「新規動画」ボタンで /admin/videos/new に遷移するか\n" +
        "6. API接続不可時に静的データでフォールバック表示されるか",
      order: 3,
      blocking: true,
    },
    {
      id: "ADMIN-004",
      title: "検索・フィルター",
      description:
        "1. 検索欄に「ストレッチ」入力 → タイトル一致の動画のみ表示されるか\n" +
        "2. 検索クリアで全件に戻るか\n" +
        "3. カテゴリ「ドリル」選択 → drill動画のみ表示されるか\n" +
        "4. ステータス「下書き」選択 → draft動画のみ表示されるか\n" +
        "5. 検索+カテゴリ+ステータスの複合フィルターが動作するか\n" +
        "6. 結果0件でもエラーにならないか\n" +
        "7. 大文字小文字を区別しない検索が動作するか",
      order: 4,
      blocking: false,
    },
    {
      id: "ADMIN-005",
      title: "新規動画作成",
      description:
        "1. /admin/videos/new で初期状態(ID/カテゴリ/タイトル/アングル1つ)が表示されるか\n" +
        "2. 必須フィールドに赤い*マークが表示されるか\n" +
        "3. 全フィールド入力→「作成」→ 成功トースト+一覧に遷移するか\n" +
        "4. 必須未入力で作成 → バリデーションエラーが表示されるか\n" +
        "5. 重複IDで作成 → APIエラーが表示されるか\n" +
        "6. アングルの追加/削除が正しく動作するか\n" +
        "7. チャプターの追加/削除が正しく動作するか\n" +
        "8. 「キャンセル」で一覧に戻るか",
      order: 5,
      blocking: true,
    },
    {
      id: "ADMIN-006",
      title: "動画編集",
      description:
        "1. 編集ページに既存データがプリフィルされるか\n" +
        "2. IDフィールドが編集不可(disabled)か\n" +
        "3. タイトル変更→「更新」→ 成功トースト+一覧に遷移するか\n" +
        "4. ステータスをドロップダウンで変更して保存できるか\n" +
        "5. アングル追加/チャプター追加して保存できるか\n" +
        "6. タイトル空で保存 → バリデーションエラーが出るか\n" +
        "7. 「キャンセル」/戻る矢印で一覧に戻るか\n" +
        "8. 存在しないIDの編集ページでエラーが表示されるか",
      order: 6,
      blocking: false,
    },
    {
      id: "ADMIN-007",
      title: "公開・非公開切替",
      description:
        "1. draft動画の目アイコンクリック → 「公開しました」トースト+バッジが「公開」に変化するか\n" +
        "2. published動画のEyeOffクリック → 「非公開にしました」トースト+バッジが「下書き」に変化するか\n" +
        "3. 公開後、視聴者側 (/) で動画が表示されるか\n" +
        "4. 非公開後、視聴者側で動画が非表示になるか\n" +
        "5. 非公開動画がPublic API (認証なしGET) で404を返すか",
      order: 7,
      blocking: true,
    },
    {
      id: "ADMIN-008",
      title: "削除",
      description:
        "1. ゴミ箱アイコンクリック → 確認ダイアログが表示されるか\n" +
        "2. 「OK」クリック → 「動画を削除しました」トースト+一覧から消えるか\n" +
        "3. 削除後にAPIからも取得できない(404)か\n" +
        "4. 「キャンセル」クリック → 動画が一覧に残るか\n" +
        "5. リロード後も削除済み動画が表示されない(永久削除)か",
      order: 8,
      blocking: true,
    },
    {
      id: "ADMIN-009",
      title: "Embed共有",
      description:
        "1. 一覧のコピーアイコンクリック → 「Embed URLをコピーしました」トースト+クリップボードにURLが入るか\n" +
        "2. 編集ページのEmbedセクションにURL・iframeスニペットが表示されるか\n" +
        "3. 各コピーボタンが動作するか\n" +
        "4. /embed/stretch-full を認証なしで開き、プレーヤーが表示されるか\n" +
        "5. ?controls=minimal でUIなし表示になるか\n" +
        "6. ?layout=main-sub でメイン+サブレイアウトになるか\n" +
        "7. /embed/nonexistent-video で「動画が見つかりません」が表示されるか",
      order: 9,
      blocking: false,
    },
    {
      id: "ADMIN-010",
      title: "Ingest App 接続設定",
      description:
        "1. /admin 下部に「動画を追加する」セクション(Mac Ingest App/手動で追加)が表示されるか\n" +
        "2. Mac Ingest Appカードに3ステップの説明が表示されるか\n" +
        "3. 「Ingest App 接続設定をコピー」クリック → ボタンテキスト変化+3秒後に元に戻るか\n" +
        "4. コピーされるJSONが {api_endpoint, admin_token, bunny_cdn_hostname} 形式か\n" +
        "5. 「手動で追加」カードの「新規動画を追加」で /admin/videos/new に遷移するか",
      order: 10,
      blocking: false,
    },
  ];

  // クエストセット選択（パスで判定）
  var isAdmin = location.pathname.startsWith("/admin");
  var quests = isAdmin ? ADMIN_QUESTS : VIEWER_QUESTS;
  var questMap = {};
  quests.forEach(function (q) {
    questMap[q.id] = q.title;
  });

  // --- レポート生成 ---
  function buildReport(session) {
    var qs = session.quests.map(function (q) {
      return {
        questId: q.questId,
        title: questMap[q.questId] || q.questId,
        status: q.status,
        concern: q.concern || false,
        comment: q.comment || null,
        feedbackCount: q.feedbacks ? q.feedbacks.length : 0,
        feedbacks: (q.feedbacks || []).map(function (f) {
          return { comment: f.comment, relativeTime: f.relativeTime };
        }),
        relativeTime: q.relativeTime,
      };
    });
    var passed = qs.filter(function (q) {
      return q.status === "COMPLETED";
    }).length;
    var failed = qs.filter(function (q) {
      return q.status === "FAILED";
    }).length;
    var blocked = qs.filter(function (q) {
      return q.status === "BLOCKED";
    }).length;
    var concernCount = qs.filter(function (q) {
      return q.concern;
    }).length;
    return {
      meta: {
        sessionId: session.sessionId,
        projectId: "thestandard",
        userId: "manual-tester",
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        duration: session.duration,
      },
      summary: {
        total: qs.length,
        passed: passed,
        failed: failed,
        blocked: blocked,
        concernCount: concernCount,
        passRate:
          qs.length > 0
            ? Math.round((passed / qs.length) * 1000) / 10
            : 0,
      },
      quests: qs,
      generatedAt: new Date().toISOString(),
    };
  }

  function showReport(report) {
    window.__report = report;
    console.log("[UAT] Report:", JSON.stringify(report, null, 2));

    var blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    var url = URL.createObjectURL(blob);
    var filename =
      "uat-report-" +
      (isAdmin ? "admin" : "viewer") +
      "-" +
      new Date().toISOString().slice(0, 10) +
      ".json";

    var toast = document.createElement("div");
    toast.style.cssText =
      "position:fixed;top:16px;left:50%;transform:translateX(-50%);" +
      "background:#111;color:#fff;padding:16px 24px;border-radius:12px;" +
      "z-index:2147483647;font-family:sans-serif;font-size:14px;" +
      "box-shadow:0 4px 20px rgba(0,0,0,.3);text-align:center;";
    toast.innerHTML =
      "<div style='margin-bottom:8px;font-weight:bold;'>UAT 完了 — " +
      report.summary.passRate +
      "% パス (" +
      report.summary.passed +
      "/" +
      report.summary.total +
      ")</div>" +
      (report.summary.blocked > 0
        ? "<div style='color:#ff6b6b;margin-bottom:4px;'>Blocked: " +
          report.summary.blocked +
          "件</div>"
        : "") +
      (report.summary.concernCount > 0
        ? "<div style='color:#fdcb6e;margin-bottom:8px;'>気になる: " +
          report.summary.concernCount +
          "件</div>"
        : "") +
      "<a href='" +
      url +
      "' download='" +
      filename +
      "' " +
      "style='color:#4ecdc4;text-decoration:underline;cursor:pointer;'>" +
      "JSON レポートをダウンロード</a>" +
      "<div style='margin-top:8px;color:#888;font-size:12px;'>" +
      "console に window.__report で参照可能</div>";
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.style.transition = "opacity .5s";
      toast.style.opacity = "0";
      setTimeout(function () {
        toast.remove();
      }, 500);
    }, 15000);
  }

  // --- SDK ロード & 起動 ---
  var script = document.createElement("script");
  script.src = "https://unpkg.com/@firstlook-uat/sdk@0.4.0/dist/firstlook.umd.js";
  script.onload = function () {
    console.log("[UAT] FirstLook SDK loaded");

    var sdk = new FirstLook.FirstLookSDK();

    sdk.on("*", function (event) {
      console.log("[UAT] " + event.type);
    });
    sdk.on("quest:blocked", function (event) {
      console.warn("[UAT] Quest blocked: " + event.questId);
    });

    sdk
      .init({
        projectId: "REDACTED_PROJECT_ID",
        apiKey: "flk_REDACTED",
        userId: "manual-tester",
        role: "qa",
        context: {
          app: "thestandard",
          flow: isAdmin ? "admin" : "viewer",
          testDate: new Date().toISOString(),
        },
        endpoint: "https://your-project.supabase.co/functions/v1/ingest-session",
        triggers: { tapCount: 999, deepLink: false },
        recording: { domSnapshot: false, voice: false, maxDuration: 1200 },
        security: { watermark: false },
      })
      .then(function () {
        // endSession をパッチしてレポート生成
        var origEnd = sdk.endSession.bind(sdk);
        sdk.endSession = function () {
          return origEnd().then(function (session) {
            if (session) {
              var report = buildReport(session);
              showReport(report);
            }
            return session;
          });
        };

        sdk.activate();
        return sdk.startSession(quests);
      })
      .then(function (sessionId) {
        console.log("[UAT] Session started:", sessionId);
        console.log(
          "[UAT] " +
            quests.length +
            " quests loaded (" +
            (isAdmin ? "管理画面" : "閲覧者") +
            "フロー)",
        );
      });
  };
  script.onerror = function () {
    console.error(
      "[UAT] Failed to load SDK. Run: cp ~/dev/firstlook/packages/sdk/dist/firstlook.umd.js public/",
    );
  };
  document.head.appendChild(script);
})();

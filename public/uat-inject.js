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
  //   { id, title, description, order, blocking? }
  // ============================================================

  var VIEWER_QUESTS = [
    {
      id: "VIEW-001",
      title: "動画一覧ページが表示される",
      description:
        "1. トップページ（/）を開く\n2. ヒーローセクションに動画タイトルと「再生する」ボタンが見えるか\n3. ヘッダーに「THE STANDARD」ロゴがあるか\n4. カテゴリフィルター（すべて / トレーニング / ドリル / メソッド / インタビュー）が並んでいるか\n5. 動画カードがグリッド表示されているか",
      order: 1,
      blocking: true,
    },
    {
      id: "VIEW-002",
      title: "カテゴリフィルターで絞り込みできる",
      description:
        "1. 「ドリル」フィルターをタップ → ドリル動画のみ表示されるか\n2. 「すべて」をタップ → 全動画が復帰するか\n3. 「インタビュー」をタップ → 該当なし表示（「動画がありません」）になるか",
      order: 2,
      blocking: false,
    },
    {
      id: "VIEW-003",
      title: "動画詳細ページに遷移し情報が表示される",
      description:
        "1. 動画カードまたはヒーローの「再生する」をタップ\n2. 詳細ページ（/videos/:id）に遷移するか\n3. タイトル（h1）・説明文・カテゴリバッジ・収録日が表示されるか\n4. 動画プレーヤー領域が見えるか",
      order: 3,
      blocking: true,
    },
    {
      id: "VIEW-004",
      title: "マルチアングルレイアウトを切り替えられる",
      description:
        "1. 2アングル以上の動画詳細ページを開く\n2. レイアウトボタン 3種（シングル / 均等 / メイン+サブ）が見えるか\n3. 各レイアウトをタップし、表示が切り替わるか\n4. シングルビューでアングルタブ（正面 / 側面）が表示されるか\n5. タブ切替でアングルが変わるか",
      order: 4,
      blocking: false,
    },
    {
      id: "VIEW-005",
      title: "チャプターナビゲーションが機能する",
      description:
        "1. チャプター付き動画（trainer-session等）の詳細ページを開く\n2. サイドパネルの「チャプター」タブをタップ\n3. チャプター一覧が表示されるか\n4. チャプターをクリック → 再生位置がジャンプするか\n5. チャプタードット（ExerciseOverlay）がシークバー上に表示されるか",
      order: 5,
      blocking: false,
    },
    {
      id: "VIEW-006",
      title: "字幕のON/OFFが切り替えられる",
      description:
        "1. 字幕対応の動画詳細ページを開く\n2. 字幕ボタン（CCアイコン）が見えるか\n3. タップ → 字幕OFFになるか（ボタンスタイルが変わる）\n4. もう一度タップ → ONに戻るか",
      order: 6,
      blocking: false,
    },
    {
      id: "VIEW-007",
      title: "キーボードショートカットが動作する",
      description:
        "1. 動画詳細ページでプレーヤーをフォーカス\n2. Space/K → 再生/一時停止が切り替わるか\n3. J → 10秒巻き戻し、L → 10秒早送りされるか\n4. F → フルスクリーン切替\n5. M → ミュート切替\n6. ,/. → フレーム単位のコマ送り",
      order: 7,
      blocking: false,
    },
    {
      id: "VIEW-008",
      title: "再生速度を変更できる",
      description:
        "1. 動画プレーヤーの速度メニューを開く\n2. 選択肢（0.25x 〜 2x）が表示されるか\n3. 1.5x を選択 → 実際に速度が変わるか\n4. 1x に戻す",
      order: 8,
      blocking: false,
    },
    {
      id: "VIEW-009",
      title: "ナビゲーション（戻る・404）が正しく動作する",
      description:
        "1. 詳細ページの「←」ボタンをタップ → 一覧ページに戻るか\n2. 存在しないURL（/videos/xxx）を直接入力 → 「動画が見つかりません」が表示されるか\n3. 「一覧に戻る」リンクで復帰できるか",
      order: 9,
      blocking: false,
    },
    {
      id: "VIEW-010",
      title: "モバイル表示が崩れない",
      description:
        "1. DevTools でモバイルビュー（390×844）に切り替える\n2. 一覧ページ: ヒーロー・フィルター・カードが縦並びで表示されるか\n3. 詳細ページ: シングルビュー + アングルタブで表示されるか\n4. タッチターゲット（ボタン等）が 40px 以上あるか\n5. ダブルタップで ±10秒 ジェスチャーが動くか",
      order: 10,
      blocking: false,
    },
  ];

  var ADMIN_QUESTS = [
    {
      id: "ADMIN-001",
      title: "ダッシュボードのKPIが正しく表示される",
      description:
        "1. /admin を開く\n2. 「ダッシュボード」見出しが見えるか\n3. KPIカード 4枚（動画数 / 総時間 / カテゴリ / 公開中）が表示されるか\n4. 最近の更新セクションに動画が並んでいるか\n5. 「Ingest App 接続設定をコピー」ボタンが見えるか",
      order: 1,
      blocking: true,
    },
    {
      id: "ADMIN-002",
      title: "動画管理ページで一覧が表示され検索できる",
      description:
        "1. /admin/videos を開く\n2. 動画リストが表示されるか\n3. 件数バッジ（例: 3件）が正しいか\n4. 検索ボックスに「ストレッチ」と入力 → 絞り込まれるか\n5. 検索をクリア → 全件に戻るか",
      order: 2,
      blocking: true,
    },
    {
      id: "ADMIN-003",
      title: "カテゴリ・ステータスフィルターが機能する",
      description:
        "1. /admin/videos でカテゴリフィルターから「ドリル」を選択 → 該当動画のみ表示\n2. フィルターを「すべて」に戻す\n3. ステータスフィルターから「下書き」を選択 → draft動画のみ表示\n4. フィルターをリセット",
      order: 3,
      blocking: false,
    },
    {
      id: "ADMIN-004",
      title: "新規動画を作成できる",
      description:
        "1. /admin/videos/new を開く\n2. Video ID（例: uat-test）、タイトル、カテゴリを入力\n3. アングル情報を入力（ID: front, Label: 正面）\n4. 「作成」ボタンをタップ\n5. 「動画を作成しました」成功トーストが表示されるか",
      order: 4,
      blocking: false,
    },
    {
      id: "ADMIN-005",
      title: "動画の公開ステータスを変更できる",
      description:
        "1. /admin/videos を開く\n2. draft状態の動画の「公開する」ボタンをタップ\n3. 「公開しました」トーストが表示されるか\n4. ステータス表示が「公開中」に変わるか",
      order: 5,
      blocking: false,
    },
    {
      id: "ADMIN-006",
      title: "動画の編集ページに遷移できる",
      description:
        "1. /admin/videos を開く\n2. 任意の動画の「編集」ボタン（鉛筆アイコン）をタップ\n3. 編集ページ（/admin/videos/:id）に遷移するか\n4. フォームに既存データが表示されているか",
      order: 6,
      blocking: false,
    },
    {
      id: "ADMIN-007",
      title: "動画を削除できる（確認ダイアログ付き）",
      description:
        "1. /admin/videos を開く\n2. 任意の動画の「削除」ボタン（ゴミ箱アイコン）をタップ\n3. 確認ダイアログが表示されるか\n4. 「OK」をタップ → 「動画を削除しました」トーストが表示されるか\n5. 一覧から削除された動画が消えるか",
      order: 7,
      blocking: false,
    },
    {
      id: "ADMIN-008",
      title: "Embed共有URLが機能する",
      description:
        "1. /embed/stretch-full を開く（認証不要）\n2. 動画プレーヤーが表示されるか\n3. レイアウト切替（シングル/均等）が動作するか\n4. チャプターパネルが開くか\n5. 字幕トグルが動作するか",
      order: 8,
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
  script.src = "/firstlook.umd.js";
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
        projectId: "thestandard",
        apiKey: "manual-uat",
        userId: "manual-tester",
        role: "qa",
        context: {
          app: "thestandard",
          flow: isAdmin ? "admin" : "viewer",
          testDate: new Date().toISOString(),
        },
        endpoint: "http://localhost:9999/noop",
        triggers: { tapCount: 999, deepLink: false, shake: false },
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

        // upload リクエストを無視
        var origFetch = window.fetch;
        window.fetch = function (url, opts) {
          if (typeof url === "string" && url.includes("localhost:9999")) {
            return Promise.resolve(new Response('{"ok":true}', { status: 200 }));
          }
          return origFetch.apply(this, arguments);
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

/**
 * THE STANDARD — 手動 UAT ローダー
 *
 * 使い方:
 *   1. npm run dev でアプリ起動
 *   2. ブラウザのコンソールで以下を実行:
 *      const s=document.createElement('script');s.src='/uat-inject.js';document.head.appendChild(s);
 *   3. 右下にクエストオーバーレイが表示される
 *   4. 各クエストの手順に従い OK / 気になる / NG を判定
 *   5. 完了後、JSON レポートが画面に表示 + ダウンロード可能
 */
(function () {
  if (window.__uatLoaded) {
    console.warn("[UAT] Already loaded");
    return;
  }
  window.__uatLoaded = true;

  // --- Shadow DOM を open mode に強制 ---
  const origAttach = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    return origAttach.call(this, { ...init, mode: "open" });
  };

  // --- クエスト定義 ---
  const VIEWER_QUESTS = [
    {
      id: "v1",
      title: "動画一覧ページ表示",
      description:
        "1. トップページ（/）を開く\n2. ヒーローセクションに動画タイトルが表示されるか\n3. カテゴリフィルターボタン（すべて/トレーニング/ドリル/メソッド/インタビュー）が並んでいるか\n4. 動画カードが表示されるか",
      order: 1,
    },
    {
      id: "v2",
      title: "カテゴリフィルター",
      description:
        "1. 「ドリル」をタップ → ドリル動画のみ表示されるか\n2. 「すべて」をタップ → 全動画に戻るか\n3. 「インタビュー」をタップ → 該当なし表示になるか",
      order: 2,
    },
    {
      id: "v3",
      title: "動画詳細ページ遷移",
      description:
        "1. 動画カードまたはヒーローをタップ\n2. 詳細ページに遷移するか\n3. タイトル・説明文・カテゴリ・収録日が表示されるか",
      order: 3,
    },
    {
      id: "v4",
      title: "マルチアングル切り替え",
      description:
        "1. 2アングル以上の動画を開く\n2. レイアウトボタン（シングル/均等/メイン+サブ）を切り替える\n3. シングルビューでアングルタブ（正面/側面）が表示されるか",
      order: 4,
    },
    {
      id: "v5",
      title: "字幕ON/OFF",
      description:
        "1. 字幕対応の動画詳細ページを開く\n2. 字幕ボタンをタップ → OFF になるか\n3. もう一度タップ → ON に戻るか",
      order: 5,
    },
    {
      id: "v6",
      title: "ナビゲーション",
      description:
        "1. 詳細ページの「←」ボタンをタップ → 一覧に戻るか\n2. 存在しないURL（/videos/xxx）を入力 → 「動画が見つかりません」が出るか\n3. 「一覧に戻る」で復帰するか",
      order: 6,
    },
  ];

  const ADMIN_QUESTS = [
    {
      id: "a1",
      title: "管理ダッシュボード",
      description:
        "1. /admin を開く\n2. KPIカード（動画数・総時間・カテゴリ・公開中）が表示されるか\n3. 最近の更新セクションが表示されるか",
      order: 1,
    },
    {
      id: "a2",
      title: "動画管理 — 一覧・検索",
      description:
        "1. /admin/videos を開く\n2. 動画リストが表示されるか\n3. 検索ボックスに文字入力 → 絞り込まれるか\n4. 検索クリア → 全件に戻るか",
      order: 2,
    },
    {
      id: "a3",
      title: "動画管理 — フィルター",
      description:
        "1. カテゴリフィルターで「ドリル」を選択 → 絞り込まれるか\n2. ステータスフィルターで「下書き」を選択 → 絞り込まれるか",
      order: 3,
    },
    {
      id: "a4",
      title: "新規動画作成",
      description:
        "1. /admin/videos/new を開く\n2. ID・タイトル・カテゴリ・アングルを入力\n3. 「作成」をタップ → 成功通知が表示されるか",
      order: 4,
    },
    {
      id: "a5",
      title: "公開ステータス変更",
      description:
        "1. /admin/videos を開く\n2. 下書き状態の動画の公開ボタンをタップ\n3. 「公開しました」トーストが表示されるか",
      order: 5,
    },
    {
      id: "a6",
      title: "動画削除",
      description:
        "1. /admin/videos を開く\n2. 動画の削除ボタンをタップ → 確認ダイアログが出るか\n3. 確認 → 「動画を削除しました」が表示されるか",
      order: 6,
    },
  ];

  // --- quest set 選択 ---
  const isAdmin = location.pathname.startsWith("/admin");
  const quests = isAdmin ? ADMIN_QUESTS : VIEWER_QUESTS;
  const questMap = {};
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

    // ダウンロードリンク生成
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
      (report.summary.concernCount > 0
        ? "<div style='color:#fdcb6e;margin-bottom:8px;'>⚠ 気になる: " +
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

    sdk
      .init({
        projectId: "thestandard",
        apiKey: "manual-uat",
        userId: "manual-tester",
        endpoint: "http://localhost:9999/noop",
        triggers: { tapCount: 999, deepLink: false, shake: false },
        recording: { domSnapshot: false, voice: false },
        security: { watermark: false },
      })
      .then(function () {
        // endSession をパッチ
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

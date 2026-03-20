/**
 * FirstLook UAT SDK — THE STANDARD
 * Loads SDK, fetches quests from Dashboard API, starts session.
 */
(function () {
  "use strict";

  var CONFIG = {
    sdkUrl: "https://unpkg.com/@firstlook-uat/sdk@0.4.4/dist/firstlook.umd.js",
    projectId: "5038fbd4-c451-4193-8a71-dafc6139e1a1",
    apiKey: "flk_ad8a7c4107ced930062618997abdfc61",
    userId: "kenny@atsume.io",
    endpoint: "https://gsibiheavhlksowhfuow.supabase.co/functions/v1/ingest-session",
    questsEndpoint: "https://gsibiheavhlksowhfuow.supabase.co/functions/v1/export-quests",
  };

  var script = document.createElement("script");
  script.src = CONFIG.sdkUrl;
  script.onload = function () {
    console.log("[UAT] FirstLook SDK loaded");
    var sdk = new FirstLook.FirstLookSDK();

    sdk.on("*", function (event) {
      console.log("[UAT]", event.type);
    });

    sdk
      .init({
        projectId: CONFIG.projectId,
        apiKey: CONFIG.apiKey,
        userId: CONFIG.userId,
        endpoint: CONFIG.endpoint,
        triggers: { deepLink: false, tapCount: 999 },
        recording: { domSnapshot: false, voice: false, maxDuration: 1800 },
        security: { watermark: false },
      })
      .then(function () {
        console.log("[UAT] SDK initialized");
        sdk.activate();

        // Fetch quests from Dashboard API
        return fetch(CONFIG.questsEndpoint, {
          headers: { "X-API-Key": CONFIG.apiKey },
        });
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.quests || data.quests.length === 0) {
          console.warn("[UAT] No quests found. Import quests in the Dashboard first.");
          return;
        }
        console.log("[UAT] " + data.quests.length + " quests loaded");
        return sdk.startSession(data.quests);
      })
      .then(function (sessionId) {
        if (sessionId) console.log("[UAT] Session started:", sessionId);
      })
      .catch(function (err) {
        console.error("[UAT] Error:", err);
      });
  };
  script.onerror = function () {
    console.error("[UAT] Failed to load FirstLook SDK");
  };
  document.head.appendChild(script);
})();

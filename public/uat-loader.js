/**
 * FirstLook UAT SDK — THE STANDARD
 * v0.8.0+: SDK handles tester selection, launcher, and session flow internally.
 * Just init() + activate() — no manual quest fetch needed.
 */
(function () {
  "use strict";

  var CONFIG = {
    sdkUrl: "https://cdn.jsdelivr.net/npm/@firstlook-uat/sdk@latest/dist/firstlook.umd.js",
    projectId: "5038fbd4-c451-4193-8a71-dafc6139e1a1",
    apiKey: "flk_ad8a7c4107ced930062618997abdfc61",
    endpoint: "https://gsibiheavhlksowhfuow.supabase.co/functions/v1/ingest-session",
  };

  var script = document.createElement("script");
  script.src = CONFIG.sdkUrl;
  script.onload = function () {
    console.log("[UAT] FirstLook SDK loaded (v0.8.0+)");
    var sdk = new FirstLook.FirstLookSDK();

    sdk.on("*", function (event) {
      console.log("[UAT]", event.type);
    });

    sdk
      .init({
        projectId: CONFIG.projectId,
        apiKey: CONFIG.apiKey,
        endpoint: CONFIG.endpoint,
        triggers: { deepLink: false, tapCount: 999 },
        recording: { domSnapshot: false, voice: false, maxDuration: 1800 },
        security: { watermark: false },
      })
      .then(function () {
        console.log("[UAT] SDK initialized, state:", sdk.getState());
        // SDK handles tester → launcher → quest set → session internally
        sdk.activate();
        window.__firstlook = sdk;
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

/**
 * FirstLook UAT SDK — Configuration Template
 *
 * Copy this file to uat-inject.js and fill in your values:
 *   cp public/uat-inject.example.js public/uat-inject.js
 *
 * Get credentials from: https://firstlook-dashboard.fly.dev
 *   1. Create a project → copy Project ID
 *   2. Settings → Create API Key → copy key (shown once)
 *
 * Activate in browser:
 *   - URL: ?uat=1
 *   - Keyboard: Ctrl+Shift+U (Mac: ⌘+Shift+U)
 *   - Multi-tap: tap screen 5 times quickly
 */
(function () {
  "use strict";

  var script = document.createElement("script");
  script.src = "https://unpkg.com/@firstlook-uat/sdk@0.4.2/dist/firstlook.umd.js";
  script.onload = function () {
    var sdk = new FirstLook.FirstLookSDK();
    sdk.init({
      projectId: "YOUR_PROJECT_ID",
      apiKey: "flk_YOUR_API_KEY",
      userId: "tester@example.com",
      endpoint: "https://your-project.supabase.co/functions/v1/ingest-session",
    });
  };
  document.head.appendChild(script);
})();

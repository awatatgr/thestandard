const ALLOWED_ORIGINS = [
  "https://thestandard.coach",
  "https://thestandard.pages.dev",
];

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") || "";
  // Allow matching origins, or any *.thestandard.pages.dev preview deploy
  const allowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".thestandard.pages.dev");
  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

interface Env {
  ADMIN_TOKEN?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const corsHeaders = getCorsHeaders(context.request);

  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(context.request.url);

  // Public API: GET /api/videos requires no auth (returns published only)
  const isPublicRead = context.request.method === "GET" &&
    url.pathname.match(/^\/api\/videos(\/[^/]+)?$/);

  // Write operations always require ADMIN_TOKEN
  if (!isPublicRead) {
    if (!context.env.ADMIN_TOKEN) {
      return new Response(JSON.stringify({ error: "ADMIN_TOKEN not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const auth = context.request.headers.get("Authorization");
    if (auth !== `Bearer ${context.env.ADMIN_TOKEN}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const response = await context.next();
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
};

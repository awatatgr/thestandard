const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Env {
  ADMIN_TOKEN?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(context.request.url);

  // Public API: GET /api/videos requires no auth (returns published only)
  const isPublicRead = context.request.method === "GET" &&
    url.pathname.match(/^\/api\/videos(\/[^/]+)?$/);

  // Admin API requires auth
  if (!isPublicRead && context.env.ADMIN_TOKEN) {
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

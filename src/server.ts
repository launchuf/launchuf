import handler from "@tanstack/react-start/server-entry";

type Fetch = (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
const appFetch = handler.fetch as unknown as Fetch;

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(self)",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
};

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname.endsWith(".local");

    // Tvinga HTTPS (Cloudflare "Always Use HTTPS" gör samma sak på kanten — detta är en extra säkring).
    if (url.protocol === "http:" && !isLocal) {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    const response = await appFetch(request, env, ctx);
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      if (!headers.has(key)) headers.set(key, value);
    }
    // Admin och betalsidor ska aldrig cachas eller indexeras.
    if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/betalning") || url.pathname === "/tack") {
      headers.set("X-Robots-Tag", "noindex, nofollow");
      headers.set("Cache-Control", "no-store");
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};

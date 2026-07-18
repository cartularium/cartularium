// Cloudflare Pages catchall Function for the edit-wiki SPA.
//
// IMPORTANT: this function fires for EVERY request under /edit/*, including
// requests for static assets like /edit/index.html, /edit/edit-index.json,
// and /edit/assets/<hashed>.{js,css,...}. CF Pages' default precedence for
// catchall Functions is function-first, not static-first.
//
// We use the "static first, SPA on 404" pattern: try ASSETS.fetch with the
// original request; if a real asset exists at the path, serve it (preserves
// Content-Type so JS/CSS load correctly). If not, fall back to serving the
// SPA's index.html so the client-side router can take over for routes like
// /edit/SUMIF, /edit/concept/Array, /edit/drafts, etc.
//
// Replaces the prior _redirects approach: CF Pages' redirect parser flags
// `/edit/* /edit/index.html 200` as a self-loop and drops the rule, even
// though status 200 means "rewrite" (no actual loop). Pages Functions are
// CF's canonical pattern for nested-path SPAs and avoid the heuristic.
//
// This Function lives in the monorepo's shared `functions/` dir, which CF
// Pages picks up at the root directory. Other Pages projects sharing the
// repo (cartularium-org, assay) also pick up this Function but its
// behavior is benign on properties without /edit/index.html — ASSETS.fetch
// returns the project's 404 page in that case.

export async function onRequest(context) {
  // Try to serve the requested URL as a static asset first. This handles
  // /edit/index.html, /edit/assets/*, /edit/edit-index.json, and any future
  // paths that have a real file in the deploy.
  const assetResponse = await context.env.ASSETS.fetch(context.request)
  if (assetResponse.status !== 404) return assetResponse

  // No matching asset → SPA fallback for client-side routing.
  return await context.env.ASSETS.fetch(new URL("/edit/index.html", context.request.url))
}

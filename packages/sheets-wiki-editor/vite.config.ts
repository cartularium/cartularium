import { defineConfig, loadEnv } from "vite"
import preact from "@preact/preset-vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  // Default to local wrangler-running edit-shell so 'pnpm dev' works
  // end-to-end without round-tripping to the deployed shell. Override
  // to a remote URL (e.g., https://sheets.wiki) only when intentionally
  // pointing the editor at deployed infra.
  const editShellUrl = env.EDIT_SHELL_DEV_URL || "http://localhost:8787"
  // Default to local Quartz (port 8081) so /edit/edit-index.json comes from
  // the in-flight branch's content, not the production sheets.wiki canonical
  // (which builds from `main` and may not yet have the editor wiring). Local
  // Quartz emits public/edit/edit-index.json via the EditIndex emitter on
  // each build, including in --serve mode.
  const wikiUrl = env.WIKI_DEV_URL || "http://localhost:8081"
  const editShellIsHttps = editShellUrl.startsWith("https://")
  const wikiIsHttps = wikiUrl.startsWith("https://")

  return {
    base: mode === "production" ? "/edit/" : "/",
    plugins: [preact()],
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    server: {
      port: 8083,
      strictPort: true,
      proxy: {
        "/api/edit": {
          target: editShellUrl,
          changeOrigin: true,
          secure: editShellIsHttps,
          // xfwd sets X-Forwarded-For / X-Forwarded-Port / X-Forwarded-Proto.
          // It does NOT set X-Forwarded-Host (http-proxy quirk), so we attach
          // a proxyReq handler to copy the original request's Host header into
          // X-Forwarded-Host. Edit-shell's requestOrigin honors that on
          // localhost-shaped requests so the OAuth redirect_uri lands the
          // bounce-back on this Vite server (8083), not wrangler (8787).
          xfwd: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              const host = req.headers.host
              if (host) proxyReq.setHeader("X-Forwarded-Host", host)
            })
          },
        },
        "/edit/edit-index.json": {
          target: wikiUrl,
          changeOrigin: true,
          secure: wikiIsHttps,
        },
      },
    },
  }
})

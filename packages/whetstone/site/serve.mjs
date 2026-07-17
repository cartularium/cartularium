// dev server over public/. watches site/ + problems/, rebuilds on change,
// pings the browser via SSE so it can reload. Cloned from cartularium-org.
import { createServer } from "node:http"
import { readFileSync, statSync, watch } from "node:fs"
import { join, extname, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { build, SRC, OUT } from "./build.mjs"

const PORT = Number(process.env.PORT || 8084)
const PROBLEMS = join(dirname(fileURLToPath(import.meta.url)), "..", "problems")

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
}

const RELOAD_CLIENT = `
<script>
(function () {
  if (!window.EventSource) return;
  var es = new EventSource("/__reload");
  es.addEventListener("reload", function () { location.reload(); });
  es.addEventListener("error", function () { /* server restarting */ });
})();
</script>`

const sseClients = new Set()
function broadcastReload() {
  for (const res of sseClients) {
    try {
      res.write("event: reload\ndata: 1\n\n")
    } catch (_) {}
  }
}

try {
  const { counts } = build()
  console.log(`built ${counts.problems} problem page(s)`)
} catch (e) {
  console.error("build failed:", e.message)
}

let rebuildTimer = null
function scheduleRebuild() {
  clearTimeout(rebuildTimer)
  rebuildTimer = setTimeout(() => {
    try {
      const t0 = Date.now()
      build()
      console.log(`rebuilt in ${Date.now() - t0}ms`)
      broadcastReload()
    } catch (e) {
      console.error("rebuild failed:", e.message)
    }
  }, 80)
}

watch(SRC, { recursive: true }, () => scheduleRebuild())
watch(PROBLEMS, { recursive: true }, () => scheduleRebuild())

createServer((req, res) => {
  const path = decodeURIComponent(req.url.split("?")[0])

  if (path === "/__reload") {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    })
    res.write("retry: 1000\n\n")
    sseClients.add(res)
    req.on("close", () => sseClients.delete(res))
    return
  }

  let full = join(OUT, path === "/" ? "/index.html" : path)
  try {
    if (statSync(full).isDirectory()) full = join(full, "index.html")
    const ext = extname(full)
    const type = TYPES[ext] || "application/octet-stream"
    let buf = readFileSync(full)
    if (ext === ".html") {
      buf = Buffer.from(buf.toString("utf8").replace("</body>", `${RELOAD_CLIENT}</body>`))
    }
    res.writeHead(200, { "content-type": type, "cache-control": "no-store" })
    res.end(buf)
  } catch (_) {
    res.writeHead(404, { "content-type": "text/plain" })
    res.end("not found")
  }
}).listen(PORT, () => {
  console.log(`serving ${OUT} at http://localhost:${PORT}  (watching ${SRC} + problems/)`)
})

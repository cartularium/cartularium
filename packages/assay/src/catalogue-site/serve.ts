// dev server for the catalogue site. builds once, watches data + template
// dirs, rebuilds on change, broadcasts SSE so the browser auto-reloads.
// mirrors the cartularium-org serve.mjs pattern so the dev loop feels the
// same across properties.

import { createServer, type ServerResponse } from "node:http";
import { readFileSync, statSync, watch, cpSync, existsSync } from "node:fs";
import { join, extname, relative, resolve } from "node:path";
import { buildSite, type BuildOptions } from "./index.js";

export interface ServeOptions extends BuildOptions {
  port: number;
  // src dir → build dest. when src changes, mirror to build/ before rebuild
  // so the running JS picks up the new templates/assets
  srcMirrors?: Record<string, string>;
}

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
};

const RELOAD_CLIENT = `
<script>
(function () {
  if (!window.EventSource) return;
  var es = new EventSource("/__reload");
  es.addEventListener("reload", function () { location.reload(); });
  es.addEventListener("error", function () { /* server restarting; browser will reconnect */ });
})();
</script>`;

export function serveSite(opts: ServeOptions): void {
  const safeRoot = resolve(opts.outDir);

  try {
    const r = buildSite(opts);
    console.log(`built ${r.dvCount} DV pages · ${r.testCount} tests`);
  } catch (e) {
    console.error("initial build failed:", (e as Error).message);
  }

  const sseClients = new Set<ServerResponse>();
  const broadcastReload = (): void => {
    for (const res of sseClients) {
      try { res.write("event: reload\ndata: 1\n\n"); } catch { /* client gone */ }
    }
  };

  let timer: NodeJS.Timeout | null = null;
  const scheduleRebuild = (label: string): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const t0 = Date.now();
      try {
        if (opts.srcMirrors) {
          for (const [src, dest] of Object.entries(opts.srcMirrors)) {
            if (existsSync(src)) cpSync(src, dest, { recursive: true });
          }
        }
        buildSite(opts);
        console.log(`rebuilt (${label}) in ${Date.now() - t0}ms`);
        broadcastReload();
      } catch (e) {
        console.error(`rebuild failed (${label}):`, (e as Error).message);
      }
    }, 80);
  };

  const watchDirs = [
    opts.catalogueDir,
    opts.testsDir,
    opts.fixturesDir,
    ...Object.keys(opts.srcMirrors ?? {}),
  ];
  for (const dir of watchDirs) {
    if (!existsSync(dir)) continue;
    try {
      watch(dir, { recursive: true }, (_event, filename) => {
        if (filename) scheduleRebuild(`${dir}/${filename}`);
      });
    } catch (e) {
      console.warn(`could not watch ${dir}: ${(e as Error).message}`);
    }
  }

  createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
    if (url === "/__reload") {
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      });
      res.write("retry: 1000\n\n");
      sseClients.add(res);
      req.on("close", () => sseClients.delete(res));
      return;
    }
    let full = join(opts.outDir, url === "/" ? "/index.html" : url);
    const rel = relative(safeRoot, resolve(full));
    if (rel.startsWith("..")) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
      return;
    }
    try {
      if (statSync(full).isDirectory()) full = join(full, "index.html");
      const ext = extname(full);
      const type = TYPES[ext] ?? "application/octet-stream";
      let buf = readFileSync(full);
      if (ext === ".html") {
        buf = Buffer.from(buf.toString("utf8").replace("</body>", `${RELOAD_CLIENT}</body>`));
      }
      res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
      res.end(buf);
    } catch {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
    }
  }).listen(opts.port, () => {
    console.log(`serving ${opts.outDir} at http://localhost:${opts.port}`);
  });
}

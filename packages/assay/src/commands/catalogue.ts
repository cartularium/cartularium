// render the divergence catalogue to a static site

import { buildSite } from "../catalogue-site/index.js";
import { serveSite } from "../catalogue-site/serve.js";
import { values } from "./shared.js";

export function catalogue(): void {
  const buildDir = (values.build as string | undefined) ?? "build/site";
  const catalogueDir = (values["catalogue-dir"] as string | undefined) ?? "divergences";
  const testsDir = (values["tests-dir"] as string | undefined) ?? "tests";
  const fixturesDir = "fixtures";
  const historyDir = (values["history-dir"] as string | undefined) ?? "history";
  const opts = { catalogueDir, testsDir, fixturesDir, outDir: buildDir, historyDir };

  if (values.serve as boolean) {
    const port = Number(values.port ?? process.env.PORT ?? 8082);
    try {
      serveSite({
        ...opts,
        port,
        srcMirrors: {
          "src/catalogue-site/templates": "build/catalogue-site/templates",
          "src/catalogue-site/assets": "build/catalogue-site/assets",
        },
      });
    } catch (e) {
      console.error(`catalogue --serve: ${(e as Error).message}`);
      process.exit(1);
    }
    return;
  }

  try {
    const result = buildSite(opts);
    console.log(`Built static site at ${result.outDir}/`);
    console.log(`  ${result.dvCount} DV pages · ${result.testCount} tests indexed`);
    console.log(`  manifest.json: ${result.manifestFunctionCount} functions`);
    if (result.historyRunCount > 0) {
      console.log(`  agreement-history.json: ${result.historyRunCount} run(s)`);
    }
    console.log(`  open ${result.outDir}/index.html in a browser`);
  } catch (e) {
    console.error(`catalogue: ${(e as Error).message}`);
    process.exit(1);
  }
}

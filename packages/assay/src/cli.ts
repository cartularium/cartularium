#!/usr/bin/env node

async function main() {
  const { values, positionals } = await import("./commands/shared.js");
  const command = positionals[0];
  const rest = positionals.slice(1);

  if (values.help && !command) {
    const { help } = await import("./commands/help.js");
    return help();
  }

  switch (command) {
    case undefined:
    case "help":         return (await import("./commands/help.js")).help();
    case "login":        return (await import("./auth.js")).login();
    case "setup":        return (await import("./commands/setup.js")).setup();
    case "generate":     return (await import("./commands/generate.js")).generate(rest);
    case "validate":     return (await import("./commands/validate.js")).validate(rest);
    case "run":          return (await import("./commands/run.js")).run(rest);
    case "benchmark":    return (await import("./commands/benchmark.js")).benchmark(rest);
    case "check":        return (await import("./commands/check.js")).check(rest);
    case "lint":         return (await import("./commands/lint.js")).lint(rest);
    case "matrix":       return (await import("./commands/matrix.js")).matrix(rest);
    case "catalogue":    return (await import("./commands/catalogue.js")).catalogue();
    case "manifest":     return (await import("./commands/manifest.js")).manifest();
    case "seed-fork-annotations": return (await import("./commands/seed-fork-annotations.js")).seedForkAnnotations();
    case "preview":      return (await import("./commands/preview.js")).preview(rest);
    case "preview-status": return (await import("./commands/preview-status.js")).previewStatus();
    case "preview-worker": return (await import("./commands/preview-worker.js")).previewWorker();
    case "history":      return (await import("./commands/history.js")).history();
    case "scaffold":     return (await import("./commands/scaffold.js")).scaffold(rest);
    case "coverage":     return (await import("./commands/coverage.js")).coverage();
    case "measure":      return (await import("./commands/measure.js")).measure(rest);
    // unknown verb — treat positionals as test files for `run`
    default:             return (await import("./commands/run.js")).run(positionals);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

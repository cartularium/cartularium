import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config"

export default defineWorkersConfig({
  test: {
    // `globalSetup` runs in the Node test-runner process (not inside the
    // workerd isolate), which is where `msw/node` needs to live — see the
    // header comment in `test/setup.ts` for the rationale.
    globalSetup: ["./test/setup.ts"],
    // `setupFiles` run inside the workerd isolate per test file, which is
    // where `fetchMock` from `cloudflare:test` activates. Used by every
    // test that mocks GitHub-API calls the Worker makes.
    setupFiles: ["./test/worker-setup.ts"],
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.test.toml" },
        miniflare: {
          bindings: {
            GITHUB_APP_ID: "1234",
            GITHUB_APP_PRIVATE_KEY: "-----BEGIN RSA PRIVATE KEY-----\nFAKE\n-----END RSA PRIVATE KEY-----",
            GITHUB_APP_CLIENT_ID: "Iv1.test",
            GITHUB_APP_CLIENT_SECRET: "test_secret",
            COOKIE_DOMAIN: ".sheets.wiki",
            CANONICAL_OWNER: "cartularium",
            CANONICAL_REPO: "cartularium",
            ALLOWED_ORIGINS: "https://sheets.wiki,https://assay.sheets.wiki",
            ASSAY_RUNNER_TOKEN: "test-runner-token",
            ASSAY_MAINTAINERS: "alice",
          },
          kvNamespaces: ["SESSIONS", "RATE_LIMIT"],
          r2Buckets: ["ASSETS", "ASSAY_PREVIEW"],
          d1Databases: ["ASSAY_PREVIEW_DB"],
        },
      },
    },
  },
})

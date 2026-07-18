// Tells TypeScript what `env` from `cloudflare:test` resolves to.
// The runtime values come from `vitest.config.ts`'s miniflare.bindings;
// this declaration mirrors the same shape the Worker sees at runtime.
import type { Env } from "../src/env"

declare module "cloudflare:test" {
  interface ProvidedEnv extends Env {}
}

// Node-side auth bootstrap for the CLIs. Missing judge auth fails closed.
import { setTokenProvider } from "./api.js";
import { getJudgeAccessToken } from "./auth.js";

export function useNodeAuth(): void {
  let cached: string | null = null;
  setTokenProvider(async () => {
    if (cached) return cached;
    cached = await getJudgeAccessToken();
    if (cached) return cached;
    throw new Error(
      "Ludus judge identity is not authenticated. " +
        "Run `pnpm --filter @cartularium/ludus run login`.",
    );
  });
}

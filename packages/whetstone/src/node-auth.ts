// Node-side auth bootstrap for the CLIs: judge identity first
// (~/.whetstonerc.json), personal assay token as a dev fallback.
import { getAccessToken } from "assay";
import { setTokenProvider } from "./api.js";
import { getJudgeAccessToken } from "./auth.js";

export function useNodeAuth(): void {
  let cached: string | null = null;
  setTokenProvider(async () => {
    if (cached) return cached;
    cached = await getJudgeAccessToken();
    if (cached) return cached;
    cached = await getAccessToken();
    if (!cached) {
      throw new Error(
        "No Google identity available. Run `pnpm --filter @cartularium/whetstone run login` " +
          "(judge identity) or `assay login` (personal fallback).",
      );
    }
    console.error("[whetstone] no judge identity — falling back to personal assay token");
    return cached;
  });
}

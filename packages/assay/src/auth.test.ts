import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadCredentials } from "./auth.js";

const originalCredentialsJson = process.env.ASSAY_GOOGLE_CREDENTIALS_JSON;
const originalCredentialsPath = process.env.ASSAY_GOOGLE_CREDENTIALS_PATH;

afterEach(() => {
  setEnv("ASSAY_GOOGLE_CREDENTIALS_JSON", originalCredentialsJson);
  setEnv("ASSAY_GOOGLE_CREDENTIALS_PATH", originalCredentialsPath);
});

describe("Google credentials loading", () => {
  it("loads OAuth client credentials from ASSAY_GOOGLE_CREDENTIALS_PATH", () => {
    delete process.env.ASSAY_GOOGLE_CREDENTIALS_JSON;
    const dir = mkdtempSync(join(tmpdir(), "assay-google-credentials-"));
    const path = join(dir, "google-credentials.json");
    writeFileSync(path, JSON.stringify({
      installed: {
        client_id: "client-from-path",
        client_secret: "secret-from-path",
      },
    }));
    process.env.ASSAY_GOOGLE_CREDENTIALS_PATH = path;

    expect(loadCredentials()).toEqual({
      clientId: "client-from-path",
      clientSecret: "secret-from-path",
    });
  });
});

function setEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

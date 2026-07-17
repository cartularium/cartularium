// Push the judge's Google credentials into the deployed Worker's secrets.
// Requires `wrangler login` first. Reads the same sources as make-dev-vars.
import { execSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const PKG = join(dirname(fileURLToPath(import.meta.url)), "..")
const credsPath = [
  process.env.WHETSTONE_GOOGLE_CREDENTIALS_PATH,
  join(PKG, "credentials.json"),
].filter(Boolean).find((p) => existsSync(p))
if (!credsPath) throw new Error("no credentials.json — mint the whetstone OAuth client first")
const creds = JSON.parse(readFileSync(credsPath, "utf8")).installed
const token = JSON.parse(readFileSync(join(homedir(), ".whetstonerc.json"), "utf8"))

for (const [name, value] of [
  ["GOOGLE_CLIENT_ID", creds.client_id],
  ["GOOGLE_CLIENT_SECRET", creds.client_secret],
  ["GOOGLE_REFRESH_TOKEN", token.refresh_token],
]) {
  execSync(`npx wrangler secret put ${name}`, { cwd: PKG, input: value, stdio: ["pipe", "inherit", "inherit"] })
}
console.log("secrets pushed: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN")

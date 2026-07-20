// Generate .dev.vars (gitignored) for `wrangler dev` from Ludus's OAuth
// client and the local judge refresh token.
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const PKG = join(dirname(fileURLToPath(import.meta.url)), "..")
const credsPath =
  [process.env.LUDUS_GOOGLE_CREDENTIALS_PATH, join(PKG, "credentials.json")]
    .filter(Boolean)
    .find((p) => existsSync(p))
if (!credsPath) throw new Error("no Ludus credentials.json")
const raw = JSON.parse(readFileSync(credsPath, "utf8"))
const creds = raw.installed || raw.web
const token = JSON.parse(readFileSync(join(homedir(), ".ludusrc.json"), "utf8"))

writeFileSync(
  join(PKG, ".dev.vars"),
  [
    `GOOGLE_CLIENT_ID=${creds.client_id}`,
    `GOOGLE_CLIENT_SECRET=${creds.client_secret}`,
    `GOOGLE_REFRESH_TOKEN=${token.refresh_token}`,
    `ALLOWED_ORIGIN=*`,
    "",
  ].join("\n"),
)
console.log("wrote .dev.vars (gitignored — contains live judge credentials)")

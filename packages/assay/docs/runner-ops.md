# Assay Runner Operations

Concrete day-to-day operations runbook for assay preview-runner hosts. Pairs with
[preview-runner.md](./preview-runner.md), which covers the protocol; this doc covers
the running-real-hosts side.

Canonical host as of 2026-05: **chris** (`chriss.mac.mini.lan`, LAN `192.168.1.57`).
The maintainer reaches chris over a WireGuard tunnel from the dev box.

## Topology on chris

Two worker processes, two different supervisors:

| Worker | runnerId | Platforms | Managed by | Reason |
|---|---|---|---|---|
| Preview-worker (headless) | `mac-mini-runner` | `hyperformula` | launchd: `wiki.sheets.assay-preview-worker.plist` | Headless-safe, runs as a daemon. |
| Review-worker (Terminal) | `mac-mini-runner-review` | `excel,gsheets` | watchdog: `wiki.sheets.assay-review-terminal-watchdog.plist` → `run-assay-review-worker.command` | Needs an Aqua session for Excel.app + TCC permissions; the watchdog `open -a Terminal` opens a window so it inherits the user's Aqua context. |

Both processes call the same `assay preview-worker --platform <list>` CLI under the
hood; only the supervision style and `ASSAY_RUNNER_ID` suffix differ.

The watchdog's plist has `LimitLoadToSessionType=Aqua` + `StartInterval=60`: it fires
every 60s, checks `pgrep -f "preview-worker --platform excel,gsheets"`, and if no
match, runs `open -a Terminal run-assay-review-worker.command`. Reliable as long as
the assay-runner user is GUI-logged-in. **Do not switch this to `Background`** — Excel
won't run there.

## Filesystem layout on chris

```
~/cartularium-runner/
├── assay-runner.env             # ASSAY_RUNNER_TOKEN, BASE_URL, RUNNER_ID, WORK_DIR
├── cartularium/                 # git checkout, pinned to main
├── run-assay-review-worker.command   # exec'd by Terminal; sets PATH, sources env, exec node
├── watch-assay-review-worker.sh # the watchdog script (launchd target)
├── logs/
│   ├── assay-preview-worker.err.log     # hyperformula stderr
│   ├── assay-review-worker.err.log      # excel,gsheets stderr (only on shell failures)
│   ├── assay-review-worker.out.log
│   ├── assay-review-terminal-watchdog.out.log   # "starting Terminal review worker" entries
│   └── assay-preview-status.latest.log  # snapshot from watchdog's status check
├── secrets/
│   └── google-credentials.json
└── work/                        # scratch dir for in-flight jobs
```

`~/Library/LaunchAgents/` holds the two plists; edit them there. Reload with
`launchctl bootout gui/<uid>/<label>` + `launchctl bootstrap gui/<uid> <path>`.

## Day-to-day operations

### First contact (pickup agents / reviewers start here)

**Prerequisites that should already be on the dev box** — if any are missing, set up out-of-band before continuing:

1. **WireGuard `astral` tunnel** active. The tunnel is managed via the
   WireGuard.app GUI (not the brew CLI). To verify it's up *without
   needing wg CLI tools*:

   ```sh
   netstat -rn -f inet | grep -E '192\.168\.1|utun'
   ```

   You should see `192.168.1` (LAN subnet) routed through a `utun*`
   interface. If you see no `utun*` route to that subnet, the tunnel is
   down — open WireGuard.app and toggle the connection. See the
   `project-cartularium-dev-tunnel` memory for known pitfalls
   (duplicate-keypair flap, `.conf` drift between brew and GUI).

2. **`~/.ssh/config` entries** for both aliases:

   ```
   Host chris
       HostName 192.168.1.57
       User chriscrpntr
       IdentityFile ~/.ssh/id_ed25519

   Host assay-runner
       HostName 192.168.1.57
       User assay-runner
       IdentityFile ~/.ssh/id_ed25519
   ```

3. **`ASSAY_RUNNER_TOKEN`** for the status-endpoint check. Lives at
   `~/.config/cartularium/dev/edit-shell.dev.vars` on the dev box
   (symlinked into `packages/edit-shell/.dev.vars`). Source it before
   `curl`ing the status endpoint.

**Verification — run these in order; each catches a different failure mode:**

```sh
# 1. Tunnel route present?
netstat -rn -f inet | grep 192.168.1.57

# 2. IP reachable?
ping -c 2 -W 2000 192.168.1.57

# 3. SSH connection?
ssh -o ConnectTimeout=5 assay-runner 'whoami; uname -srm'

# 4. Runner registered + recently heartbeated?
set -a; source ~/.config/cartularium/dev/edit-shell.dev.vars; set +a
curl -s -H "Authorization: Bearer $ASSAY_RUNNER_TOKEN" \
  https://sheets.wiki/api/edit/assay-runner/status | jq .runners

# 5. Workers actually running?
ssh assay-runner 'pgrep -fl "preview-worker --platform"'
```

If 1-2 fail → tunnel issue. If 3 fails → either chris is off/asleep
or the firewall is blocking. If 4 shows runners with a stale
`lastCompletedAt` and (5) shows no processes → launchd watchdog has
stopped firing (see "Watchdog log stuck" below). All four green plus
two PIDs from (5) means the system is healthy.

`~/.ssh/config` reaches both aliases at `192.168.1.57` directly via the
tunnel; no ProxyJump needed.

### Check the runner is healthy

From any machine that has `ASSAY_RUNNER_TOKEN`:

```sh
curl -s -H "Authorization: Bearer $ASSAY_RUNNER_TOKEN" \
  https://sheets.wiki/api/edit/assay-runner/status | jq .runners
```

A healthy runner shows in `runners[]` with a recent `lastCompletedAt` whenever a
job has completed. **`lastHeartbeatAt` is per-job, not a liveness ping** — it only
populates while a worker is actively running a claimed job. Null heartbeat with no
recent jobs is normal.

From chris:

```sh
ssh assay-runner 'pgrep -fl "node packages/assay"'
ssh assay-runner 'tail ~/cartularium-runner/logs/assay-review-worker.err.log'
```

### Restart workers cleanly

```sh
ssh assay-runner '
  launchctl kickstart -k "gui/$(id -u)/wiki.sheets.assay-preview-worker"
  launchctl kickstart -k "gui/$(id -u)/wiki.sheets.assay-review-terminal-watchdog"
'
```

The watchdog kickstart will pgrep before spawning, so it won't double-spawn if a
Terminal review-worker is already running. If you need a forced respawn, kill the
existing PID first.

### Pull and rebuild on chris

The deployed code on chris's cartularium checkout occasionally drifts from
`main`. To refresh:

```sh
ssh assay-runner '
  cd ~/cartularium-runner/cartularium
  git fetch origin main
  git pull origin main
  export PATH="/usr/local/bin:$PATH"   # /usr/local/bin is NOT in the default PATH for this user
  cd packages/assay
  pnpm run clean && pnpm run build     # clean first — tsc --incremental can skip with stale state
  pkill -f "preview-worker --platform" # let the supervisors respawn against the new build
'
```

Then verify the build:

```sh
ssh assay-runner 'stat -f "%Sm %N" ~/cartularium-runner/cartularium/packages/assay/build/cli.js'
```

A fresh mtime means the rebuild took. If `cli.js` mtime is unchanged after a
non-clean build, that's the tsbuildinfo cache lying — always pair builds with
`pnpm run clean` after a `git pull`.

`pnpm install` is only required when `pnpm-lock.yaml` changed; `git diff
<old>..<new> -- pnpm-lock.yaml` will tell you.

### Run an Aqua-requiring command (Excel) from SSH

xlwings + Excel needs an **Aqua session** for Apple Events authorization —
SSH-spawned processes can't control Excel.app (you'll get `aem.EventError
-1743 "Not authorized to send Apple events"`). The review-worker dodges this
via its watchdog → `open -a Terminal` chain. Use the same trick for ad-hoc
runs (e.g. `assay generate` for a fixture refresh, the C9 probe, anything
xlwings-driven):

```sh
ssh assay-runner '
  cat > ~/cartularium-runner/run-once.command <<EOF
#!/bin/zsh
LOG=~/cartularium-runner/logs/run-once.\$\$.log
DONE=~/cartularium-runner/logs/run-once.\$\$.done
echo "[\$(date)] starting (pid \$\$)" > \$LOG
source ~/.zprofile
export PATH=/usr/local/bin:\$PATH
set -a; source ~/cartularium-runner/assay-runner.env; set +a
cd ~/cartularium-runner/cartularium/packages/assay
# YOUR COMMAND HERE — for example:
node build/cli.js generate tests/arithmetic.yaml --platform excel >> \$LOG 2>&1
EXIT=\$?
echo "[\$(date)] exit=\$EXIT" >> \$LOG
echo \$EXIT > \$DONE
EOF
  chmod +x ~/cartularium-runner/run-once.command
  rm -f ~/cartularium-runner/logs/run-once.*.{done,log} 2>/dev/null
  pkill -f "Microsoft Excel" 2>/dev/null; sleep 2
  open -a Terminal ~/cartularium-runner/run-once.command
'
```

Then from your dev box, poll for the `.done` sentinel rather than holding
the SSH session open (the long-running ssh tends to drop on WG flap):

```sh
for i in $(seq 1 60); do
  sleep 30
  OUT=$(ssh assay-runner "ls ~/cartularium-runner/logs/run-once.*.done 2>/dev/null | head -1" 2>/dev/null)
  [ -n "$OUT" ] && echo "DONE" && break
done
ssh assay-runner "
  DONE=\$(ls -t ~/cartularium-runner/logs/run-once.*.done | head -1)
  echo \"exit=\$(cat \$DONE)\"
  tail -20 \${DONE%.done}.log
"
```

Empirical timings from the 2026-05-23/24 coalescing-session runs:
- Single-suite gsheets smoke (6 tests): ~3s wall.
- Single-suite Excel smoke (6 tests): ~4-30s depending on Surface B work.
- Full catalogue regen (33 suites × excel+gsheets, 1957 tests): ~4 minutes.

**Don't use this for the recurring review-worker traffic** — that's already
handled by the `wiki.sheets.assay-review-terminal-watchdog.plist` chain.
This pattern is for one-off batch work (regen, probes, debugging).

## Choosing your approach

Three ways to run code through chris; use the one that matches your task:

| Approach | When to use | Aqua context? | Notes |
|---|---|---|---|
| **Direct SSH** (`ssh assay-runner '<cmd>'`) | gsheets, hyperformula, anything not involving Excel.app; quick diagnostics; reading files | No | Fast, simple. Must source `~/.zprofile` + `~/cartularium-runner/assay-runner.env` (see recipes). |
| **Terminal-bridge** (`open -a Terminal <script>`) | Anything that calls Excel via xlwings: `assay generate --platform excel`, the C9 D9 probe, custom Python probes | Yes (inherits the user's GUI Aqua + Apple Events permissions) | One-off batch work. Always pair with a `.done` sentinel + dev-box poller (sample in next section). |
| **Job queue** (publish via edit-shell API) | Production preview jobs; nothing you'd write by hand here | Yes (review-worker runs in Terminal-launched Aqua) | This is what the running preview-workers already poll for. Don't try to drive it manually for ad-hoc work — the workflow is a published-job-then-poll-results pattern designed for end-user previews. |

**Rule of thumb for agents:** anything Excel = Terminal-bridge; anything else = direct SSH. Don't reach for the job queue for one-off work.

## Common task recipes

### Regenerate fixtures for one suite

```sh
# gsheets (direct SSH works — no Aqua needed):
ssh assay-runner '
  source ~/.zprofile
  export PATH=/usr/local/bin:$PATH
  set -a; source ~/cartularium-runner/assay-runner.env; set +a
  cd ~/cartularium-runner/cartularium/packages/assay
  node build/cli.js generate tests/arithmetic.yaml --platform gsheets
'

# Excel (needs Terminal-bridge — see "Run an Aqua-requiring command" below)
```

### Regenerate the full catalogue (excel + gsheets, all suites)

~4 minutes wall on the runner (empirical 2026-05-24). Use the
Terminal-bridge wrapper pattern. Generic template + poller in "Run an
Aqua-requiring command" below.

### Test a single formula end-to-end

Write a one-off YAML at `~/cartularium-runner/cartularium/packages/assay/tests/probe-XXX.yaml`
with a single test (name + subject must match `/^[a-z0-9][a-z0-9-]*$/`),
regen via Terminal-bridge, inspect
`fixtures/probe-XXX/<platform>.json`. Remove the probe YAML +
fixture afterward so it doesn't pollute the catalogue.

### Validate code changes against real Excel

1. Sync local changes to runner via `rsync` (skip `node_modules` /
   `build` / `*.tsbuildinfo` / `dist`):

   ```sh
   rsync -av --exclude=node_modules --exclude=build --exclude=dist \
     --exclude='*.tsbuildinfo' --exclude=.turbo --exclude=coverage \
     ~/personal/cartularium/packages/assay/ \
     assay-runner:cartularium-runner/cartularium/packages/assay/
   ```

2. Rebuild on runner:

   ```sh
   ssh assay-runner '
     source ~/.zprofile && export PATH=/usr/local/bin:$PATH
     cd ~/cartularium-runner/cartularium
     pnpm --filter @cartularium/contracts build
     pnpm --filter assay build
   '
   ```

3. Run target via Terminal-bridge (Excel) or direct SSH (gsheets).

4. When done, optionally sync runner-side files back if a linter / hook
   touched them. Runner's git working tree will be dirty after rsync;
   `git checkout .` on the runner cleans up if needed.

### Inspect why a preview job failed

```sh
# Recent runner errors:
ssh assay-runner 'tail -50 ~/cartularium-runner/logs/assay-review-worker.err.log'
ssh assay-runner 'tail -50 ~/cartularium-runner/logs/assay-preview-worker.err.log'

# Runner status from API (includes lastErrorCode/lastErrorMessage):
set -a; source ~/.config/cartularium/dev/edit-shell.dev.vars; set +a
curl -s -H "Authorization: Bearer $ASSAY_RUNNER_TOKEN" \
  https://sheets.wiki/api/edit/assay-runner/status | jq .runners

# Specific preview job result (replace JOB_ID):
curl -s -H "Authorization: Bearer $ASSAY_RUNNER_TOKEN" \
  https://sheets.wiki/api/edit/assay-runner/result/JOB_ID | jq .
```

## Path & shell gotchas on chris

- **`/usr/local/bin` is not in `assay-runner`'s default PATH.** `node` and `pnpm`
  ($HOME/.local/bin/pnpm) need explicit PATH. The `.command` wrapper sets
  `export PATH=/usr/local/bin:$PATH` for this reason. SSH invocations of the
  worker scripts must do the same, or source `~/.zprofile`.
- **`status` is a read-only variable in zsh.** Don't use it as a loop variable in
  inline ssh scripts; use `stage_status` or similar.

## Common failure modes

### `ping: cannot resolve chriss.mac.mini.lan: Unknown host`

DNS-via-tunnel isn't resolving the mDNS-like hostname. WireGuard tunnel
may still be up — the LAN IP often works even when the hostname doesn't.
Try the IP directly:

```sh
ping -c 2 192.168.1.57
ssh assay-runner    # SSH config maps the alias to the IP, no DNS needed
```

If the IP ping also times out, the tunnel is down or chris is offline.
Check `netstat -rn | grep 192.168.1` for the route; if missing → bring
up the WireGuard tunnel. If the route is present but ping times out →
chris is asleep/off, or its WG side has flapped (common per the
`project-cartularium-dev-tunnel` memory).

### `ssh: connect to host 192.168.1.57 port 22: Operation timed out`

LAN IP isn't reachable from the dev box. Same diagnosis as above —
tunnel up but remote end unreachable. Most often: Mac mini's WG side
flapped, or the box went to sleep. Wake / re-establish then retry.

### `auth error: 403 ... "The caller does not have permission"` from gsheets

The CLI was run without sourcing `~/cartularium-runner/assay-runner.env`,
so `ASSAY_SPREADSHEET_ID` is missing and the driver fell back to a
default ID that the authenticated OAuth user can't read. Always source
the env file before any CLI invocation that touches gsheets:

```sh
ssh assay-runner '
  source ~/.zprofile
  set -a; source ~/cartularium-runner/assay-runner.env; set +a   # <-- this
  cd ~/cartularium-runner/cartularium/packages/assay
  node build/cli.js ...
'
```

Note that the gsheets OAuth token cache at `~/.assayrc.json` is separate;
that one is checked + refreshed automatically by `getAccessToken()` and
typically has a multi-hour expiry. If the token is genuinely expired (rare
unless the box has been off for >7 days), see the
`project-assay-gsheets-7day-expiry` memory.

### `aem.EventError(-1743, ...)` or `procNotFound (-600)` from Excel

`-1743 = "Not authorized to send Apple events"`. The SSH-spawned process
isn't on Excel's automation allow list. Direct SSH to chris cannot drive
Excel.app — use the Terminal-bridge wrapper (see "Run an Aqua-requiring
command from SSH" above). `-600 = procNotFound` usually follows when
Excel quits mid-session; the same fix applies.

### `OSERROR: -609 "Connection is invalid"` from xlwings on Mac

Mac Apple Events bridge dropped its connection to Excel — typically
because Excel crashed under load (the bridge can't sustain ~5K+ events
per chunk; Surface B's `.api` per-cell fetches will reproduce this within
~3 sheets). This was the empirical reason the Mac Surface B live path is
disabled; see [`driver-surface-coalescing-2026-05-23.md`](./driver-surface-coalescing-2026-05-23.md)
"Surface B Mac story" for the full diagnosis. If you see this from new
code, you're probably making too many per-cell `.api` calls — batch via
bulk reads or skip on Mac.

### `claim failed: 500` in worker err log

Usually transient and one-off (worker startup race against edit-shell cold start).
If it persists, check the request ID against Cloudflare Workers logs. If
`assay-runner.ts` changed in edit-shell since the last deploy, redeploy edit-shell:

```sh
pnpm --filter @cartularium/edit-shell run deploy   # needs Workers:Edit token
```

### `fetch failed` repeated in worker err log

`ASSAY_RUNNER_BASE_URL` is unreachable. Two known causes:

- Env file points at a stale Cloudflare tunnel URL (e.g. `*.trycloudflare.com`
  from a smoke test that wasn't reverted). Cure: restore from
  `~/cartularium-runner/assay-runner.env.smoke-backup-*` or set to the
  canonical `https://sheets.wiki/api/edit`.
- DNS / network outage from chris; check `ping sheets.wiki` on chris.

### `runner_id: local-preview` in a result

Indicates the `assay preview` CLI was run somewhere with the runner endpoint's
bearer but without `--runner-id`, since `local-preview` is the fallback when
no runner id is passed (see `commands/preview.ts`). It is **not** a real
in-process edit-shell runner (an earlier diagnosis suggested that; production
D1 audit on 2026-05-21 confirmed no `local-preview` rows ever appeared and
no edit-shell code calls `runAssayPreview`). If you do see it, find and
re-stamp the runner that posted it.

### Watchdog log stuck at an old timestamp, no review-worker running

The watchdog only writes `== starting Terminal review worker ==` when it
spawns; quiet logs mean the pgrep gate keeps matching. The pgrep pattern is
`preview-worker --platform excel,gsheets` — note that the headless preview-worker
for `hyperformula` does NOT match (different `--platform`), so it won't fool
the gate.

### Terminal windows piling up on chris

If Terminal preferences drift, the `.command` script's window won't close on
shell exit and `open -a Terminal` accumulates windows on every watchdog fire.
Two prefs must hold for `assay-runner`:

```sh
defaults read com.apple.Terminal "Window Settings:Clear Dark"   # shellExitAction = 1
defaults read -g NSQuitAlwaysKeepsWindows                      # 0
```

If either is wrong, set:

```sh
defaults write com.apple.Terminal "Window Settings:Clear Dark" -dict-add shellExitAction -int 1
defaults write -g NSQuitAlwaysKeepsWindows -bool false
rm -rf "$HOME/Library/Saved Application State/com.apple.Terminal.savedState"
```

Then restart Terminal for the change to bite.

## Known limitations (2026-05-21)

- **Excel and Sheets drivers verified on `=SUM(1,2)`** end to end as of
  2026-05-21 after OAuth re-auth + publishing the gsheets OAuth client.
  Beyond the trivial smoke the drivers are not yet stressed at scale.
- **Hyperformula driver is fully working** via `mac-mini-runner`.
- **`createDrivers` was previously fail-fast** — a missing gsheets token
  would block Excel from running because both share one `createDrivers` call.
  Fixed 2026-05-21 to isolate per-platform setup failures.
- **CF Pages auto-deploy can silently skip pushes** when the `path_includes`
  filter doesn't match. See [project-cartularium-deploy](#) memory and
  `scripts/cf-pages-sync-watch.sh`.

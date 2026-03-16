---
name: browse
description: >
  Automate any website — open pages, click, fill forms, take screenshots,
  extract text. Uses a single headless Chromium instance with persistent
  cookies. Auto-screenshots after every action. Session logs enable
  post-run analysis and learning.
argument-hint: <mission-description>
disable-model-invocation: true
allowed-tools: Bash(*), Read(*), Write(*)
---

# Browser Automation

Single headless Chromium browser. One session at a time. Never run commands in parallel.

## Setup (run once, idempotent)

```bash
bash ${CLAUDE_SKILL_DIR}/../../scripts/setup.sh
```

## Session ID

Generate a session ID at the start of every mission. Use it for ALL commands.

```bash
SESSION_ID="browse-$(date +%Y%m%d-%H%M%S)"
CLI="node ${CLAUDE_SKILL_DIR}/../../vendor/browser/dist/cli.js --session $SESSION_ID"
```

Screenshots save to: `browser/screenshots/$SESSION_ID/`
Logs save to: `browser/logs/$SESSION_ID/session.jsonl`

## Commands

CRITICAL: Run commands ONE AT A TIME. Wait for output before running the next.

### Navigation

| Command | Description |
|---------|-------------|
| `$CLI open <url>` | Open URL, prints snapshot + auto-screenshot |
| `$CLI snapshot` | Re-read current page structure with refs |
| `$CLI text` | Extract all visible text |
| `$CLI scroll <up\|down\|top\|bottom>` | Scroll + auto-screenshot |
| `$CLI screenshot [path]` | Extra screenshot (auto ones usually suffice) |
| `$CLI status` | Show session URL and title |
| `$CLI close` | End browser session |

### Interaction (all auto-screenshot after action)

| Command | Description |
|---------|-------------|
| `$CLI click <ref>` | Click element by snapshot ref number |
| `$CLI fill <ref> <text>` | Clear field, type text |
| `$CLI type <ref> <text>` | Append text to field |
| `$CLI press <key>` | Press key: Enter, Tab, Escape, ArrowDown |
| `$CLI wait <ms>` | Wait for content to load |

## How refs work

1. `open` and `click` auto-print the page snapshot with numbered refs: `[3] button "Submit"`
2. Use that number: `$CLI click 3` or `$CLI fill 3 "hello"`
3. Refs change after page updates — use `snapshot` to refresh them

## Execution rules

1. SEQUENTIAL ONLY — never run two browser commands at the same time
2. AUTO-EXECUTE — click, fill, type, press without asking the user for permission
3. ONE BROWSER — the CLI reuses the existing session; never launch a second instance
4. SCREENSHOT REVIEW — after each action, review the auto-screenshot to verify it worked
5. PLAN THEN ACT — before each action, state what you will do and why in a single line
6. RECOVER — if an action fails or the page looks wrong, take a snapshot and re-plan

## Mission workflow

### 1. Start session

```bash
SESSION_ID="browse-$(date +%Y%m%d-%H%M%S)"
CLI="node ${CLAUDE_SKILL_DIR}/../../vendor/browser/dist/cli.js --session $SESSION_ID"
```

### 2. Write mission plan

Before touching the browser, write a brief plan to the session log:

```bash
mkdir -p ${CLAUDE_SKILL_DIR}/../../logs/$SESSION_ID
cat > ${CLAUDE_SKILL_DIR}/../../logs/$SESSION_ID/plan.md << 'PLAN'
## Mission
<what the user asked>

## Steps
1. <step>
2. <step>
...
PLAN
```

### 3. Execute loop

For each step:

```
a. State intent:  "Clicking [ref] to open the search results"
b. Run command:   $CLI click <ref>
c. Review output: Read the snapshot + screenshot output
d. Decide next:   If page changed as expected → continue to next step
                  If unexpected → snapshot, re-plan, adapt
```

### 4. Close and summarize

```bash
$CLI close
```

Write a summary to the session log:

```bash
cat >> ${CLAUDE_SKILL_DIR}/../../logs/$SESSION_ID/summary.md << 'SUMMARY'
## Result
<what was accomplished>

## Actions taken
<numbered list of what was done>

## Issues encountered
<any problems and how they were resolved>

## Lessons
<what to do differently next time>
SUMMARY
```

### 5. Self-analysis (optional, for complex missions)

Read back the session log to identify patterns:

```bash
cat ${CLAUDE_SKILL_DIR}/../../logs/$SESSION_ID/session.jsonl
```

Look for: wasted actions, unnecessary snapshots, wrong refs clicked, retries.
Record improvements in `lessons` so future runs are more efficient.

## Log format

`session.jsonl` — one JSON object per line, auto-written by CLI:

```json
{"ts":"2026-03-16T10:00:00Z","action":"open","detail":"https://example.com","screenshot":"browser/screenshots/session-id/001-open.png"}
{"ts":"2026-03-16T10:00:05Z","action":"click","detail":"ref=3","screenshot":"browser/screenshots/session-id/002-click-3.png"}
{"ts":"2026-03-16T10:00:10Z","action":"fill","detail":"ref=5 text=\"hello\"","screenshot":"browser/screenshots/session-id/003-fill-5.png"}
```

`plan.md` — written by agent before execution.
`summary.md` — written by agent after execution.

## Tips

- Cookie consent: if a consent banner appears, find "Accept all" button in snapshot and click it.
  Cookies persist across sessions — only needed once per site.
- Google Flights date fields: use `fill <ref> "Mar 28"` for date inputs.
- Dropdowns: click to open, then click the option ref from the updated snapshot.
- Forms: fill all fields first, then click submit.
- If a ref is not found, run `snapshot` to get fresh refs — page may have changed.

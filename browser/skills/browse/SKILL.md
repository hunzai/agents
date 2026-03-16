---
name: browse
description: >
  Automate any website — open, click, fill, screenshot. Compact ref-based
  snapshots (20 lines not 200) for fast agent decisions. Persistent cookies.
  Auto-screenshots + session logs for post-run learning.
argument-hint: <mission-description>
disable-model-invocation: true
allowed-tools: Bash(*), Read(*), Write(*)
---

# Browser Automation

Single headless Chromium. One session. Commands are sequential — never parallel.

## Setup (once)

```bash
bash ${CLAUDE_SKILL_DIR}/../../scripts/setup.sh
```

## Session

```bash
SESSION_ID="browse-$(date +%Y%m%d-%H%M%S)"
CLI="node ${CLAUDE_SKILL_DIR}/../../vendor/browser/dist/cli.js --session $SESSION_ID"
```

## Commands

### Navigation

| Command | Output |
|---------|--------|
| `$CLI open <url>` | Refs + screenshot |
| `$CLI snapshot` | Refs only (compact) |
| `$CLI snapshot full` | Full DOM tree (use rarely) |
| `$CLI text` | All visible text |
| `$CLI scroll <up\|down\|top\|bottom>` | Screenshot |
| `$CLI waitfortext <text>` | Wait up to 5s for text to appear |
| `$CLI screenshot [path]` | Manual screenshot |
| `$CLI status` | URL + title |
| `$CLI close` | End session |

### Interaction (all print refs + screenshot)

| Command | Use for |
|---------|---------|
| `$CLI click <ref>` | Buttons, links, fields — by ref number |
| `$CLI clicktext <text>` | Dropdown options, suggestions — by visible text |
| `$CLI fill <ref> <text>` | Clear + type into input field |
| `$CLI type <ref> <text>` | Append text (don't clear first) |
| `$CLI press <key>` | Enter, Tab, Escape, ArrowDown |

## Compact refs

Every command prints a flat list of VISIBLE interactive elements:

```
[1] button "Main menu"
[2] link "Google"
[8] combobox "Where from?" value="Berlin"
[13] combobox "Where to?"
[14] textbox "Departure"
[15] textbox "Return"
[16] button "Explore"
```

- Only visible elements get refs — no hidden/off-screen junk
- Refs update after every action — use the LATEST ones
- ~20 lines instead of ~200 — read fast, decide fast, act fast
- Use `snapshot full` only if you truly need DOM structure

## clicktext vs click

- `click <ref>` — when ref is clear and unambiguous
- `clicktext <text>` — for dropdown selections, suggestion lists, dynamic content.
  Text is stable across page changes; ref numbers shift. Prefer clicktext for dropdowns.

## Speed rules

1. **Every action prints refs** — open, click, fill, type, press all print refs.
   Read them and act immediately. Do NOT run a separate `snapshot` after.
2. **Use clicktext for suggestions** — after `fill`, dropdown appears. Use
   `clicktext "Berlin"` instead of snapshot + find ref + click ref.
3. **No blind waits** — use `waitfortext "some text"` instead of `wait 2000` + `snapshot`.
4. **One flow** — plan your steps before starting. Don't explore, just execute.

## Execution rules

1. SEQUENTIAL — one command, wait for output, then next
2. AUTO-EXECUTE — click, fill without asking user permission
3. READ REFS — after every action, read the printed refs to decide next step
4. RECOVER — if action fails, read error, take snapshot, re-plan
5. NEVER retry same failed ref — if click fails, the element moved or is wrong

## Tips

- Cookie consent: `$CLI clicktext Accept all` — persists across sessions
- Dropdowns: `fill` the field, then `clicktext` the suggestion text
- Dates: `fill <ref> "Mar 28"` then `press Enter`
- If click times out (5s): element is wrong. Run `snapshot` to get fresh refs.
- Viewport: 1280x900. Scroll if content is below fold.
- Session data: screenshots in `browser/screenshots/$SESSION_ID/`,
  logs in `browser/logs/$SESSION_ID/session.jsonl`

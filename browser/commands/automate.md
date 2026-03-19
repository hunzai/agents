---
description: >
  Browser automation via playwright-cli. Navigate, click, fill forms, screenshot, manage sessions.
  Use when asked to automate a website, scrape a page, interact with web UI, search the web,
  fill out online forms, or check a webpage — even if they don't explicitly mention "browser".
allowed-tools: Bash(playwright-cli:*)
---

# Browser Automation (playwright-cli)

UI-only automation. Read page state, click elements, fill forms, take screenshots.

## Hard rules

1. **UI first** — prefer click, fill, type, scroll, read snapshots.
2. **No network** — do not inspect or intercept requests.
3. **JS allowed** — use `run-code` or `eval` for dynamic content.

## Performance (important — saves 75% tokens)

**Use `-q --no-screenshot` for actions where you know the next step:**

```bash
playwright-cli click 5 -q --no-screenshot      # just "Clicked [5]" — no snapshot, no screenshot
playwright-cli fill 3 "Berlin" -q --no-screenshot
playwright-cli press Enter -q --no-screenshot
playwright-cli snapshot                          # now get refs when you need them
```

**Use `batch` for sequences of 3+ actions you're confident about:**

```bash
playwright-cli batch "click 5" "fill 3 Berlin" "press Enter" "wait 1000"
# Executes all 4 actions, returns ONE snapshot at the end
```

**Use `--selector` to scope snapshots to relevant page sections:**

```bash
playwright-cli snapshot --selector "#main-content"    # only elements in #main-content
playwright-cli snapshot --selector "[role=main]"       # only main content area
```

**When to use full snapshots vs quiet mode:**
- `open` → always get snapshot (you need initial refs)
- `fill`, `click`, `type`, `press` → use `-q` when you know the next step
- After page navigation or major state change → get a fresh `snapshot`
- `screenshot` → only when capturing results or debugging

## Quick start

```bash
playwright-cli open https://example.com
playwright-cli batch "click 15" "fill 5 search query" "press Enter"
playwright-cli snapshot
playwright-cli screenshot
playwright-cli close
```

## Core commands

| Command | Purpose |
|---------|---------|
| `open <url>` | Navigate to URL |
| `snapshot [full]` | Read interactive elements (or full tree) |
| `click <ref>` | Click element by reference |
| `fill <ref> "text"` | Fill input field |
| `type <ref> "text"` | Append text to field |
| `press <key>` | Press keyboard key |
| `screenshot [path]` | Capture page screenshot |
| `scroll down/up/top/bottom` | Scroll the page |
| `batch "cmd1" "cmd2" ...` | Execute multiple commands, one snapshot at end |
| `text` | Extract all visible text |
| `waitfortext <text>` | Wait for text to appear (5s timeout) |
| `close` | Close browser |

## Performance flags

| Flag | Effect |
|------|--------|
| `-q` / `--quiet` | Suppress auto-snapshot after actions |
| `--no-screenshot` | Suppress auto-screenshot after actions |
| `--selector <css>` | Scope snapshot to a CSS selector |

## Sessions

```bash
playwright-cli -s=mysession open https://example.com
playwright-cli -s=mysession batch "click 5" "fill 3 Berlin"
playwright-cli -s=mysession snapshot
playwright-cli -s=mysession close
```

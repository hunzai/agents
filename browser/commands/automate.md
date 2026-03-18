---
description: >
  Browser automation via playwright-cli. Navigate, click, fill forms, screenshot, manage sessions.
  Use when asked to automate a website, scrape a page, or interact with web UI.
allowed-tools: Bash(playwright-cli:*)
---

# Browser Automation (playwright-cli)

UI-only automation. Read page state, click elements, fill forms, take screenshots.

## Hard rules

1. **UI first** — prefer click, fill, type, scroll, read snapshots.
2. **No network** — do not inspect or intercept requests.
3. **JS allowed** — use `run-code` or `eval` for dynamic content.

## Quick start

```bash
playwright-cli open https://example.com
playwright-cli click e15
playwright-cli fill e5 "search query"
playwright-cli press Enter
playwright-cli screenshot
playwright-cli close
```

## Core commands

| Command | Purpose |
|---------|---------|
| `open <url>` | Navigate to URL |
| `open <url> --persistent` | Keep cookies between sessions |
| `snapshot` | Read page accessibility tree |
| `click <ref>` | Click element by reference |
| `fill <ref> "text"` | Fill input field |
| `press <key>` | Press keyboard key |
| `screenshot` | Capture page screenshot |
| `scroll down/up` | Scroll the page |
| `close` | Close browser |

## Sessions

```bash
playwright-cli -s=mysession open https://example.com
playwright-cli -s=mysession click e5
playwright-cli -s=mysession close
```

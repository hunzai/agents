---
name: playwright-cli
description: Automates browser UI interactions — navigate, click, fill forms, read text, take screenshots. Do NOT use for API calls, network interception, or JavaScript execution. When needed use env vars EMAIL and EMAIL_PASSWORD to login
metadata:
  category: automation
allowed-tools: Bash(playwright-cli:*)
---

# Browser UI Automation with playwright-cli

This tool is for interacting with **visible UI elements only**. Read what's on the page, click buttons, fill forms, scroll, take screenshots.

## Hard rules

1. **UI only** — click, fill, type, scroll, read snapshots. Never call APIs.
2. **No `run-code`** — do not execute JavaScript on the page.
3. **No `network`** — do not inspect or intercept network requests.
4. **No `route`** — do not mock or modify network traffic.
5. **No `eval`** — do not evaluate expressions on page elements.
6. **No `console`** — do not read browser console logs.
7. If data is not visible on the page, **scroll down** or **click to reveal it**. Do not try to fetch it via APIs or JS.

## Quick start

```bash
playwright-cli open https://example.com
playwright-cli click e15
playwright-cli fill e5 "search query"
playwright-cli press Enter
playwright-cli screenshot
playwright-cli close
```

## Commands

### Navigation

```bash
playwright-cli open [url]
playwright-cli open <url> --persistent
playwright-cli open <url> --profile=browser/profile
playwright-cli goto <url>
playwright-cli go-back
playwright-cli go-forward
playwright-cli reload
playwright-cli close
```

### Read page state

```bash
playwright-cli snapshot
playwright-cli snapshot --filename=result.yaml
playwright-cli screenshot
playwright-cli screenshot --filename=page.png
playwright-cli screenshot e5
```

### Interact with elements

```bash
playwright-cli click <ref>
playwright-cli dblclick <ref>
playwright-cli fill <ref> <text>
playwright-cli type <text>
playwright-cli hover <ref>
playwright-cli select <ref> <value>
playwright-cli check <ref>
playwright-cli uncheck <ref>
playwright-cli upload <file>
playwright-cli drag <startRef> <endRef>
```

### Keyboard

```bash
playwright-cli press Enter
playwright-cli press ArrowDown
playwright-cli press Tab
```

### Mouse / scroll

```bash
playwright-cli mousemove <x> <y>
playwright-cli mousewheel 0 500
```

### Tabs

```bash
playwright-cli tab-list
playwright-cli tab-new [url]
playwright-cli tab-close [index]
playwright-cli tab-select <index>
```

### Sessions

```bash
playwright-cli -s=<name> open <url> --persistent
playwright-cli -s=<name> click e6
playwright-cli -s=<name> close
playwright-cli list
playwright-cli close-all
```

### Storage (cookies / login persistence)

```bash
playwright-cli state-save auth.json
playwright-cli state-load auth.json
playwright-cli cookie-list
```

## Snapshots

Every command returns a snapshot file path. Read it to see element refs:

```
- heading "Example Domain" [level=1] [ref=e3]
- link "Learn more" [ref=e6]
```

Use refs to interact: `playwright-cli click e6`

## Extracting data

To get information from a page:
1. `snapshot` — read the ARIA tree for structured text
2. `screenshot` — capture visual state
3. `mousewheel 0 500` then `snapshot` — scroll and read more

**Never** try to call APIs, intercept requests, or run JavaScript to get data.
If the page requires login, use `--persistent` or `state-load` to restore a session.

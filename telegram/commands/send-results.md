---
description: >
  Send run results via Telegram — formatted summary with media attachments.
  Use when asked to share results, send output, notify about a completed task, or
  "send me the results" — even if they don't mention Telegram specifically.
allowed-tools: Bash(*), Read(*), Glob(*)
---

# Send Run Results via Telegram

Format and send a task run's results — text summary + media files.

### Step 1: Environment check

```bash
echo "BOT_TOKEN: ${TELEGRAM_BOT_TOKEN:+SET}" && echo "USER_ID: ${TELEGRAM_USER_ID:+SET}"
```

### Step 2: Build CLI

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh
```

### Step 3: Read run data

```bash
cat <RUN_DIR>/meta.json
```

### Step 4: Format summary (max 4000 chars)

```
*Task Complete*

> <query>

Status: <done>/<total> steps
Time: <duration>s | Cost: $<cost>

*<step title>*
<body>
```

### Step 5: Send text summary

```bash
NODE_OPTIONS="--dns-result-order=ipv4first" node ${CLAUDE_PLUGIN_ROOT}/vendor/telegram/dist/cli.js send-text "<FORMATTED_SUMMARY>"
```

### Step 6: Send media files (max 10)

For each output artifact:

```bash
NODE_OPTIONS="--dns-result-order=ipv4first" node ${CLAUDE_PLUGIN_ROOT}/vendor/telegram/dist/cli.js send-media <FILE> --caption "<filename>"
```

### Step 7: Report

```
Sent to Telegram:
  Text summary: sent
  Media files: <N> sent
```

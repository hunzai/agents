---
description: >
  Send a text message via Telegram Bot. Use when asked to message, notify, share text, or send
  results via Telegram — even if they just say "send this to me" or "notify me".
allowed-tools: Bash(*)
---

# Send Telegram Text

### Step 1: Environment check

```bash
echo "BOT_TOKEN: ${TELEGRAM_BOT_TOKEN:+SET}" && echo "USER_ID: ${TELEGRAM_USER_ID:+SET}"
```

If either is not SET, stop.

### Step 2: Build CLI (idempotent)

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh
```

### Step 3: Send message

```bash
NODE_OPTIONS="--dns-result-order=ipv4first" node ${CLAUDE_PLUGIN_ROOT}/vendor/telegram/dist/cli.js send-text "<MESSAGE>"
```

Message limit: 4096 characters. Longer text is auto-split.

---
description: >
  Send a file (photo, document, audio, video) via Telegram Bot. Auto-detects type from extension.
  Use when asked to send a file, share an image, or deliver media via Telegram.
allowed-tools: Bash(*)
---

# Send Telegram Media

### Step 1: Environment check

```bash
echo "BOT_TOKEN: ${TELEGRAM_BOT_TOKEN:+SET}" && echo "USER_ID: ${TELEGRAM_USER_ID:+SET}"
```

### Step 2: Build CLI (idempotent)

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh
```

### Step 3: Send file (auto-detects type)

```bash
NODE_OPTIONS="--dns-result-order=ipv4first" node ${CLAUDE_PLUGIN_ROOT}/vendor/telegram/dist/cli.js send-media <FILE_PATH> --caption "description"
```

Or send a specific type:

```bash
NODE_OPTIONS="--dns-result-order=ipv4first" node ${CLAUDE_PLUGIN_ROOT}/vendor/telegram/dist/cli.js send-photo <FILE_PATH> --caption "text"
NODE_OPTIONS="--dns-result-order=ipv4first" node ${CLAUDE_PLUGIN_ROOT}/vendor/telegram/dist/cli.js send-document <FILE_PATH> --caption "text"
NODE_OPTIONS="--dns-result-order=ipv4first" node ${CLAUDE_PLUGIN_ROOT}/vendor/telegram/dist/cli.js send-audio <FILE_PATH> --caption "text"
NODE_OPTIONS="--dns-result-order=ipv4first" node ${CLAUDE_PLUGIN_ROOT}/vendor/telegram/dist/cli.js send-video <FILE_PATH> --caption "text"
```

| Type | Max Size | Extensions |
|------|----------|------------|
| Photo | 10 MB | .jpg .jpeg .png .gif .webp |
| Audio | 50 MB | .mp3 .wav .ogg .m4a |
| Video | 50 MB | .mp4 .webm .mov |
| Document | 50 MB | any other |

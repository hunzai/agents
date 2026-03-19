# Telegram Plugin

Send text, photos, documents, audio, and video via Telegram Bot API. Free, no signup hassle.

## Setup (2 minutes)

### 1. Create a bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow the prompts (pick a name and username)
3. BotFather gives you a token like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
4. That's your `TELEGRAM_BOT_TOKEN`

### 2. Get your user ID

1. Search for **@userinfobot** on Telegram
2. Send it any message — it replies with your numeric ID
3. That's your `TELEGRAM_USER_ID`

### 3. Start the bot

Send `/start` to your new bot in Telegram (required before it can message you).

### 4. Add to .env

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_USER_ID=987654321
```

## Install

```bash
claude plugin install telegram@hunzai-agents
```

## Commands

```bash
# Send a text message
/send-text "Hello from shrine.agents"

# Send a file (auto-detects type)
/send-media /path/to/file.jpg --caption "Check this out"

# Send run results (formatted summary + media)
/send-results /path/to/run-dir
```

## CLI (direct usage)

```bash
bash telegram/scripts/setup.sh

node telegram/vendor/telegram/dist/cli.js send-text "Hello"
node telegram/vendor/telegram/dist/cli.js send-media image.jpg --caption "Photo"
node telegram/vendor/telegram/dist/cli.js send-photo image.jpg
node telegram/vendor/telegram/dist/cli.js send-document report.pdf --caption "Report"
```

## Limits

| Type | Max Size |
|------|----------|
| Photo | 10 MB |
| Audio | 50 MB |
| Video | 50 MB |
| Document | 50 MB |
| Text | 4096 chars (auto-split) |

No rate limits for personal bots. No expiring sessions. No business accounts.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Missing env: TELEGRAM_BOT_TOKEN` | Add token to `.env` (see step 1) |
| `Missing env: TELEGRAM_USER_ID` | Add user ID to `.env` (see step 2) |
| `Forbidden: bot can't send to user` | Send `/start` to your bot first |
| `Bad Request: chat not found` | Check TELEGRAM_USER_ID is correct |

## Links

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [BotFather](https://t.me/BotFather)

# Install
curl -fsSL https://claude.ai/install.sh | bash

## use skills
https://github.com/anthropics/skills

# Agents

A collection of Claude Code plugins. Each subdirectory is a self-contained
plugin that can be installed independently.

## Available Agents

| Agent | Description |
|-------|-------------|
| [trader](./trader/) | Solana trading agent — Jupiter Perpetuals + Spot Swap |
| [voice](./voice/) | Text-to-speech — speak any text using ElevenLabs voice AI |
| [price](./price/) | Solana price analysis — Pyth Network + CoinGecko + local history |

## Installation

Add this repo as a marketplace once, then install any agent by name:

```bash
/plugin marketplace add hunzai/agents
```

---

## trader

Solana trading agent powered by [Jupiter](https://jup.ag) Perpetuals and Spot Swap.

**Requires:** `WALLET_PATH`, `RPC_URL` in `.env`

```bash
/plugin install trader@hunzai-agents
```

Invoked automatically when you ask about opening/closing positions, swapping
tokens, checking balances, or monitoring PnL.

### Automated trading loop

Use Claude Code's `/loop` command to run the trader on a schedule. The prompt
below implements a full risk-managed perpetuals strategy:

```
/loop

Do NOT write any code or scripts. Use only the installed plugin agents below.

1. MARKET DATA → delegate to price-analyst agent:
   "Fetch SOL price to /tmp/sol_price.txt, analyze last 4h, run signal. Return: price, 4h change%, trend, prediction, confidence."

2. MANAGE POSITIONS → delegate to jupiter-trader agent:
   "List all open perps positions and calculate PnL for each at current price.
    Close any position with PnL ≥ +10% (take profit) or ≤ -10% (stop-loss)."

3. OPEN NEW POSITION → delegate to jupiter-trader agent:
   Use the price and signal from step 1. Collateral 2 USDC. Skip if same direction already open or confidence < 0.55.
   |4h change| 4–8%  → open long/short 10x (follow signal direction)
   |4h change| > 8%  → open long/short 15x (follow signal direction)
   |4h drop|  > 8% + RSI < 35 → open long 20x (mean-reversion)
   |4h change| < 4%  → no trade

4. REPORT: price, 4h change, signal, positions with PnL%, actions taken.
```

**Schedule in a Claude Code session:**

```
/loop run the trader loop above every 2 hours
```

Cancel anytime with `/loop cancel <id>`.

> **Risk note:** Always review open positions before starting the loop.
> Start with small collateral (2 USDC) to validate the strategy.

---

## voice

Text-to-speech powered by [ElevenLabs](https://elevenlabs.io). Converts text
to audio and plays it immediately using `mpv` or `ffmpeg`.

**Requires:** `ELEVENLABS_API_KEY` in `.env`

```bash
/plugin install voice@hunzai-agents
```

### Usage

**As a slash command:**

```
/voice:speak Hello, world!
/voice:speak Hello, world! --voice EXAVITQu4vr4xnSDxMaL
/voice:speak Hello, world! --model eleven_multilingual_v2
```

**As an agent** — just ask naturally:

> "Say hello in a calm female voice"
> "Read this paragraph aloud"
> "Use the Brian voice to narrate this"

### CLI reference

The plugin ships with a TypeScript CLI at `vendor/tts/`:

```bash
# Speak text (generates + plays automatically)
node vendor/tts/dist/cli.js speak "Hello world"
node vendor/tts/dist/cli.js speak "Hello world" --voice nPczCjzI2devNBz1zQrb --model eleven_turbo_v2_5
node vendor/tts/dist/cli.js speak "Hello world" --output /tmp/out.mp3 --no-play

# List voices and models
node vendor/tts/dist/cli.js voices
node vendor/tts/dist/cli.js models
```

### Voices

| Name | ID | Style |
|------|----|-------|
| George *(default)* | `JBFqnCBsd6RMkjVDRZzb` | Male, narrative |
| Brian | `nPczCjzI2devNBz1zQrb` | Male, deep |
| Chris | `iP95p4xoKVk53GoZ742B` | Male, casual |
| Liam | `TX3LPaxmHKxFdv7VOQHJ` | Male, energetic |
| Sarah | `EXAVITQu4vr4xnSDxMaL` | Female, soft |
| Charlotte | `XB0fDUnXU5powFXDhCwa` | Female, warm |
| Jessica | `cgSgspJ2msm6clMCkdW9` | Female, expressive |
| Lily | `pFZP5JQG7iQjIQuC4Bku` | Female, calm |

### Models

| Model | Latency | Languages |
|-------|---------|-----------|
| `eleven_flash_v2_5` *(default)* | ~75ms | 32 |
| `eleven_turbo_v2_5` | Balanced | 32 |
| `eleven_multilingual_v2` | Highest quality | 29 |

---

## price

Solana price analysis powered by [Pyth Network](https://pyth.network) and [CoinGecko](https://coingecko.com).
Fetches real-time prices, stores them to a local CSV file, and analyzes movements (min/max/trend/dip).

**Requires:** nothing — Pyth and CoinGecko are free. `COINGECKO_API_KEY` optional for higher rate limits.

```bash
/plugin install price@hunzai-agents
```

### Usage

**As an agent** — just ask naturally:

> "What's the current SOL price?"
> "Is SOL in a dip right now compared to the last 4 hours?"
> "Fetch and store the SOL price to /tmp/sol.txt"
> "Show me Bitcoin's price history for the last 30 days"

### CLI reference

The plugin ships with a TypeScript CLI at `vendor/price/`:

```bash
# Fetch current price from Pyth → append to file
node vendor/price/dist/cli.js fetch /tmp/sol_price.txt

# Fetch from CoinGecko instead
node vendor/price/dist/cli.js fetch /tmp/sol_price.txt --source gecko --coin solana

# Analyze the last 60 minutes
node vendor/price/dist/cli.js analysis /tmp/sol_price.txt 60

# Analyze the last 24 hours
node vendor/price/dist/cli.js analysis /tmp/sol_price.txt 1440

# CoinGecko historical (7-day SOL)
node vendor/price/dist/cli.js historical solana 7

# CoinGecko historical (30-day BTC)
node vendor/price/dist/cli.js historical bitcoin 30
```

### Price history file format

```
epoch,ISO-timestamp,price
1709500000,2024-03-03T20:26:40.000Z,145.231847
1709500060,2024-03-03T20:27:40.000Z,145.418200
```

### Pyth feed IDs

| Asset | Feed ID |
|-------|---------|
| SOL/USD | `0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d` |
| BTC/USD | `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43` |
| ETH/USD | `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace` |

---

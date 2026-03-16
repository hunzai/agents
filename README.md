# Agents

Claude Code plugins and skills for content creation and Solana trading.

## Structure

```
.claude/skills/          Workflow skills (orchestrate plugins)
  content-creator/         audio → story → Urdu → images → audio
  leverage-trade/          market analysis → trade execution
  travel-agent/            search Google Flights via browser

elevenlabs/              Plugin: speech-to-text, text-to-speech
replicate/               Plugin: image generation + image-to-video
price/                   Plugin: SOL price analysis, signals, levels
trader/                  Plugin: Jupiter Perpetuals + Spot Swap
browser/                 Plugin: headless browser automation (Playwright)
```

## Installation

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Add this repo as a marketplace, then install plugins by name:

```bash
/plugin marketplace add hunzai/agents
/plugin install trader@hunzai-agents
/plugin install price@hunzai-agents
```

## Skills

### content-creator

Audio → transcript → localized story → Urdu translation → 4 images → 4 videos → Urdu audio.
Uses elevenlabs (stt, tts) and replicate (seedream, video) plugins.

**Requires:** `ELEVENLABS_API_KEY`, `REPLICATE_API_TOKEN` in `.env`

```
/content-creator ./raw/money/ ./outputs/money/
```

### leverage-trade

SOL market analysis → trade decision → execution with confirmation → record keeping.
Uses price (signal, levels, sentiment) and trader (jupiter perps) plugins.

**Requires:** `WALLET_PATH`, `RPC_URL` in `.env`

```
/leverage-trade
```

### travel-agent

Search Google Flights for cheap and direct flights between any two cities.
Uses the browser plugin to automate the search.

```
/travel-agent Berlin to Lisbon Mar 28 return Apr 8 direct flights
```

## Example Prompts

### Content Creator

```
Run /content-creator with these inputs:

Input:  ./raw/money/
Output: ./outputs/money/

Think like a brilliant teacher explaining difficult concepts to someone
who has never studied it by breaking it down to smaller parts and visual
content. The output should be photos, videos, and audio that make the
concepts click instantly.
```

### Leverage Trading

```
Run /leverage-trade with these settings:

Collateral: 2 USDC
Max leverage: 5x (micro-trade)

Think like a professional scalp trader who protects capital above
all else. Every decision must be backed by data from the CLIs.
```

### Automated Trading Loop

Use `/loop` to run the trader on a schedule:

```
/loop

1. MARKET DATA → delegate to price-analyst agent:
   "Fetch SOL price, analyze last 4h, run signal."

2. MANAGE POSITIONS → delegate to jupiter-trader agent:
   "List open perps, calculate PnL. Close any position at +10% or -10%."

3. OPEN NEW POSITION → delegate to jupiter-trader agent:
   Collateral 2 USDC. Skip if same direction already open or confidence < 0.55.
   |4h change| 4-8%  → open 10x (follow signal)
   |4h change| > 8%  → open 15x (follow signal)
   |4h drop|  > 8% + RSI < 35 → open long 20x (mean-reversion)
   |4h change| < 4%  → no trade

4. REPORT: price, 4h change, signal, positions, actions taken.
```

## Plugins

### elevenlabs

Speech processing powered by [ElevenLabs](https://elevenlabs.io).

| Skill | Description |
|-------|-------------|
| stt | Transcribe audio files to text |
| tts | Convert text files to audio |
| speak | Speak text aloud and play immediately |

Default voice: Achar (`Vwq3FUaRDrPephO3Qaxs`)

### replicate

AI media generation powered by [Replicate](https://replicate.com).

| Skill | Model | Type |
|-------|-------|------|
| seedream (default) | bytedance/seedream-5-lite | text → image |
| video | wan-video/wan-2.2-i2v-fast | image → video |
| banana (legacy) | google/nano-banana-pro | text → image |

### price

SOL price analysis via [Pyth Network](https://pyth.network) and [CoinGecko](https://coingecko.com).

Commands: `fetch`, `signal`, `levels`, `sentiment`, `historical`, `stats`, `analysis`

### trader

Solana trading via [Jupiter](https://jup.ag).

Commands: `swap buy/sell/balance/quote`, `perps open-long/open-short/close/list/pnl`

### browser

Headless browser automation via [Playwright](https://playwright.dev).

| Skill | Description |
|-------|-------------|
| browse | Open pages, click, fill, type, screenshot, extract text |

Commands: `open`, `snapshot`, `click`, `fill`, `type`, `press`, `screenshot`, `text`, `scroll`, `wait`, `status`, `close`

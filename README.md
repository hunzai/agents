# Agents

Claude Code plugins and skills for trading, content creation, travel, and browser automation.

## Structure

```
.claude/skills/          Orchestration skills (by category)
  sol-perps/               [trading]  SOL leveraged perpetuals on Jupiter
  sol-swap/                [trading]  simple SOL/USDC dip & high swapper
  transcribe/              [content]  audio → text transcript
  translate/               [content]  text → Urdu (or other language)
  generate-images/         [content]  text prompts → images
  generate-video/          [content]  images → short .mp4 videos
  narrate/                 [content]  text → speech audio
  content-creator/         [content]  full pipeline (chains above skills)
  flight-search/           [travel]   search Google Flights via browser
  airbnb-search/           [travel]   search Airbnb for best value stays
  playwright-cli/          [automation] browser UI automation
  usage/                   [utility]  plugin usage stats

elevenlabs/              Plugin: speech-to-text, text-to-speech
replicate/               Plugin: image generation + image-to-video
price/                   Plugin: SOL price analysis, signals, levels
trader/                  Plugin: Jupiter Perpetuals + Spot Swap
browser/                 Plugin: headless browser automation (Playwright)

skills.json              Machine-readable skill catalog (by category)
llms.txt                 Plain-text catalog for LLM/agent discovery
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

## Skills by Category

### Trading

| Skill | Description | Invoke |
|-------|-------------|--------|
| sol-perps | SOL leveraged perpetuals — local highs/lows, tiered TP, 5x default | `/sol-perps [collateral] [leverage]` |
| sol-swap | Simple dip & high swapper — 1h price, 5 USDC budget, staggered entries | `/sol-swap [max-budget-usdc] [trade-size-usdc]` |
| jupiter-cli | Jupiter swap and perpetuals CLI | `/trader:jupiter-cli` |
| price-cli | Price fetch, signals, levels, sentiment | `/price:price-cli` |

**Requires:** `WALLET_PATH`, `RPC_URL` in `.env`

### Content

| Skill | Description | Invoke |
|-------|-------------|--------|
| transcribe | Audio dir → combined text transcript | `/transcribe <audio-dir> [output-dir]` |
| translate | Text → Urdu (keeps English terms) | `/translate <input> <output> [lang]` |
| generate-images | Text prompts → images (seedream default) | `/generate-images <prompts> <out> [--model]` |
| generate-video | Images + prompts → short .mp4 videos | `/generate-video <images> <out>` |
| narrate | Text → speech audio (Achar voice) | `/narrate <input> [output-dir]` |
| content-creator | Full pipeline (chains all above) | `/content-creator <audio> <output-dir>` |
| stt | Transcribe audio (plugin-level) | `/elevenlabs:stt <dir>` |
| tts | Text to audio (plugin-level) | `/elevenlabs:tts <dir>` |
| speak | Speak text aloud immediately | `/elevenlabs:speak <text>` |
| seedream | Generate images (default model) | `/replicate:seedream <in> <out>` |
| banana | Generate images (legacy) | `/replicate:banana <in> <out>` |
| video | Image-to-video (plugin-level) | `/replicate:video <in> <out>` |

**Requires:** `ELEVENLABS_API_KEY`, `REPLICATE_API_TOKEN` in `.env`

### Travel

| Skill | Description | Invoke |
|-------|-------------|--------|
| flight-search | Search Google Flights for cheap flights | `/flight-search <from> to <to> <dates> [direct]` |
| airbnb-search | Search Airbnb for best value entire homes | `/airbnb-search <city> <checkin> <checkout> [guests] [max-price]` |

### Automation

| Skill | Description | Invoke |
|-------|-------------|--------|
| playwright-cli | Browser UI automation (click, fill, screenshot) | (auto-loaded) |
| browse | Generic website automation | `/browser:browse <mission>` |

### Utility

| Skill | Description | Invoke |
|-------|-------------|--------|
| usage | Plugin usage stats and cost estimates | `/usage` |

## Plugins

### elevenlabs

Speech processing powered by [ElevenLabs](https://elevenlabs.io). Default voice: Achar (`Vwq3FUaRDrPephO3Qaxs`).

### replicate

AI media generation powered by [Replicate](https://replicate.com). Default model: seedream (`bytedance/seedream-5-lite`).

### price

SOL price analysis via [Pyth Network](https://pyth.network) and [CoinGecko](https://coingecko.com). Commands: `fetch`, `signal`, `levels`, `sentiment`, `historical`, `stats`.

### trader

Solana trading via [Jupiter](https://jup.ag). Commands: `swap buy/sell/balance/quote`, `perps open-long/open-short/close/list/pnl`.

### browser

Headless browser automation via [Playwright](https://playwright.dev). Commands: `open`, `snapshot`, `click`, `fill`, `type`, `press`, `screenshot`, `scroll`.

## Example Prompts

### Content Creator

```
/content-creator ./raw/money/ ./outputs/money/
```

### SOL Perpetuals

```
/sol-perps 2 5
```

### SOL Swap (dip buyer)

```
/sol-swap 5 2
```

### Flight Search

```
/flight-search Berlin to Lisbon Mar 28 return Apr 8 direct
```

### Airbnb Search

```
/airbnb-search Lisbon 2026-04-01 2026-04-08 2 150
```

# Project Rules

Use existing plugins and CLIs. Never write custom scripts or HTTP calls.

## Plugins (installed via marketplace)

| Plugin | Category | Purpose | CLI path |
|--------|----------|---------|----------|
| trader | trading | Jupiter Perpetuals + Spot Swap | `trader/vendor/jupiter/dist/cli.js` |
| price | trading | SOL price analysis, signals, levels | `price/vendor/price/dist/cli.js` |
| elevenlabs | content | Speech-to-text, text-to-speech | `elevenlabs/vendor/elevenlabs/dist/cli.js` |
| replicate | content | Image generation, image-to-video | `replicate/vendor/replicate/dist/cli.js` |
| browser | automation | Headless browser via playwright-cli | (global `playwright-cli` CLI) |

## Skills by Category

### Trading
| Skill | Invocation | Uses |
|-------|-----------|------|
| sol-perps | `/sol-perps [collateral] [leverage]` | price, trader |
| sol-swap | `/sol-swap [max-budget-usdc] [trade-size-usdc]` | price, trader |
| jupiter-cli | `/trader:jupiter-cli` | trader plugin |
| price-cli | `/price:price-cli` | price plugin |

### Content
| Skill | Invocation | Uses |
|-------|-----------|------|
| transcribe | `/transcribe <audio-dir> [output-dir]` | elevenlabs |
| translate | `/translate <input-file> <output-file> [lang]` | — |
| generate-images | `/generate-images <prompts-dir> <output-dir>` | replicate |
| generate-video | `/generate-video <images-dir> <output-dir>` | replicate |
| narrate | `/narrate <input> [output-dir]` | elevenlabs |
| content-creator | `/content-creator <audio> <output-dir>` | elevenlabs, replicate |
| stt | `/elevenlabs:stt <audio-dir>` | elevenlabs plugin |
| tts | `/elevenlabs:tts <input-dir>` | elevenlabs plugin |
| speak | `/elevenlabs:speak <text>` | elevenlabs plugin |
| seedream | `/replicate:seedream <in> <out>` | replicate plugin |
| banana | `/replicate:banana <in> <out>` | replicate plugin |
| video | `/replicate:video <in> <out>` | replicate plugin |

### Travel
| Skill | Invocation | Uses |
|-------|-----------|------|
| flight-search | `/flight-search <from> to <to> <dates>` | browser (playwright-cli) |
| airbnb-search | `/airbnb-search <city> <checkin> <checkout> [guests]` | browser (playwright-cli) |

### Automation
| Skill | Invocation | Uses |
|-------|-----------|------|
| playwright-cli | (auto-loaded for browser tasks) | browser plugin |
| browse | `/browser:browse <mission>` | browser plugin |

### Utility
| Skill | Invocation | Uses |
|-------|-----------|------|
| usage | `/usage` | logs/usage.log |

## Browser Automation

Uses `playwright-cli` (Microsoft's official CLI for coding agents). NOT an MCP — direct bash commands.

- Config: `.playwright/cli.config.json` (headless, 1280x900 viewport)
- Sessions: `playwright-cli -s=<name> <command>` for named sessions
- Persistent cookies: `playwright-cli -s=<name> open <url> --persistent`

## Discovery

- `skills.json` — machine-readable index organized by category (Cloudflare RFC format)
- `llms.txt` — plain-text catalog for LLM/agent consumption
- `.claude-plugin/marketplace.json` — Claude Code plugin marketplace catalog

## Key Rules

- Always build plugin CLIs before first use: `bash <plugin>/scripts/setup.sh`
- Default image model: seedream (bytedance/seedream-5-lite)
- Default voice: Achar (Vwq3FUaRDrPephO3Qaxs)
- Stop immediately if required API keys are missing — report which key and where to add it

## Target Platform

Claude Code CLI only. Do NOT create Cursor-specific configs (.cursor/mcp.json, .cursor/rules/, .cursor/skills/). All skills go under `.claude/skills/`.

## Self Improving Approach
When you are working on plugins or skill and we run into errors or issues learn from those and keep improving.

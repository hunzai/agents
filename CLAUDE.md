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

### Solana
| Skill | Invocation | Type | Uses |
|-------|-----------|------|------|
| solana/price | `/solana/price` | reference | price plugin |
| solana/trade | `/solana/trade` | reference | trader plugin |
| solana/perps | `/solana/perps [collateral] [leverage]` | pipeline | price, trader |
| solana/swap | `/solana/swap [max-budget-usdc] [trade-size-usdc]` | pipeline | price, trader |

### Audio
| Skill | Invocation | Type | Uses |
|-------|-----------|------|------|
| audio/transcribe | `/audio/transcribe <audio-dir> [output-dir]` | pipeline | elevenlabs |
| audio/narrate | `/audio/narrate <input> [output-dir] [--voice ID]` | pipeline | elevenlabs |
| audio/speak | `/audio/speak [text]` | pipeline | elevenlabs |

### Image & Video
| Skill | Invocation | Type | Uses |
|-------|-----------|------|------|
| image/generate | `/image/generate <prompts-dir> <output-dir> [--model seedream\|banana]` | pipeline | replicate |
| video/generate | `/video/generate <images-dir> <output-dir> [--resolution 480p]` | pipeline | replicate |

### Text
| Skill | Invocation | Type | Uses |
|-------|-----------|------|------|
| text/translate | `/text/translate <input-file> <output-file> [lang]` | pipeline | — |

### Content
| Skill | Invocation | Type | Uses |
|-------|-----------|------|------|
| content/create | `/content/create <audio-dir> <output-dir>` | pipeline | elevenlabs, replicate |

### Travel
| Skill | Invocation | Type | Uses |
|-------|-----------|------|------|
| travel/search-flights | `/travel/search-flights <from> to <to> <dates>` | pipeline | browser |
| travel/search-stays | `/travel/search-stays <city> <checkin> <checkout> [guests]` | pipeline | browser |

### Browser
| Skill | Invocation | Type | Uses |
|-------|-----------|------|------|
| browser/automate | `/browser/automate` | reference | browser plugin |

### Utility
| Skill | Invocation | Type | Uses |
|-------|-----------|------|------|
| usage | `/usage` | reference | logs/usage.log |

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

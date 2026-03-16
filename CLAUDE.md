# Project Rules

Use existing plugins and CLIs. Never write custom scripts or HTTP calls.

## Plugins (installed via marketplace)

| Plugin | Purpose | CLI path |
|--------|---------|----------|
| elevenlabs | Speech-to-text, text-to-speech | `elevenlabs/vendor/elevenlabs/dist/cli.js` |
| replicate | Image generation, image-to-video | `replicate/vendor/replicate/dist/cli.js` |
| price | SOL price analysis, signals, levels | `price/vendor/price/dist/cli.js` |
| trader | Jupiter Perpetuals + Spot Swap | `trader/vendor/jupiter/dist/cli.js` |
| browser | Headless browser automation | `browser/vendor/browser/dist/cli.js` |

## Orchestration Skills (.claude/skills/)

| Skill | Invocation | Plugins used |
|-------|-----------|--------------|
| content-creator | `/content-creator <audio> <output-dir>` | elevenlabs, replicate |
| leverage-trade | `/leverage-trade` | price, trader |
| travel-agent | `/travel-agent <from> to <to> <dates>` | browser |

## Plugin Skills

**elevenlabs:** stt, tts, speak
**replicate:** seedream (default images), video (image-to-video), banana (legacy images)
**price:** price-cli (fetch, signal, levels, sentiment, historical, stats)
**trader:** jupiter-cli (swap, perps)
**browser:** browse (open, click, clicktext, fill, type, screenshot, snapshot, scroll)

## Key Rules

- Always build CLIs before first use: `bash <plugin>/scripts/setup.sh`
- Default image model: seedream (bytedance/seedream-5-lite)
- Default voice: Achar (Vwq3FUaRDrPephO3Qaxs)
- Stop immediately if required API keys are missing — report which key and where to add it

## Self Improving Approach
When you are working on plugins or skill and we run into errors or issues learn from those and keep improving.

# agents — Skill & Plugin Registry

Use existing plugins and CLIs. Never write custom scripts or HTTP calls.

## Plugin Distribution

Plugins are distributed via `claude plugin install <name>@hunzai-agents`. Each plugin bundles its own commands, agents, and CLIs.

| Plugin | Install | Commands |
|--------|---------|----------|
| elevenlabs | `claude plugin install elevenlabs@hunzai-agents` | `/transcribe` `/narrate` `/speak` |
| replicate | `claude plugin install replicate@hunzai-agents` | `/image-generate` `/video-generate` |
| trader | `claude plugin install trader@hunzai-agents` | `/trade` |
| price | `claude plugin install price@hunzai-agents` | `/fetch-price` |
| browser | `claude plugin install browser@hunzai-agents` | `/automate` |
| solana-cli | `claude plugin install solana-cli@hunzai-agents` | `/wallet-create` `/wallet-balance` `/transfer` `/config` |
| zerion | `claude plugin install zerion@hunzai-agents` | `/portfolio` `/positions` |
| telegram | `claude plugin install telegram@hunzai-agents` | `/send-text` `/send-media` `/send-results` |

### Plugin Internal Structure

```
<plugin>/
├── .claude-plugin/plugin.json    # Manifest (validated by claude plugin validate)
├── commands/*.md                  # Slash commands (distributed with plugin)
├── agents/*.md                    # Subagent definitions
├── vendor/<name>/                 # CLI source + built dist/
└── scripts/setup.sh               # Build CLI (idempotent)
```

Commands use `${CLAUDE_PLUGIN_ROOT}` to reference plugin files.

### Replicate Models

| Model | ID | Cost | Best for |
|-------|----|------|----------|
| seedream (default) | `bytedance/seedream-5-lite` | $0.035/image | Text rendering, infographics |
| banana | `google/nano-banana-pro` | ~$0.04/image | Anime, creative illustrations |
| wan-video | wan-video | ~$0.10/video | Short clips from images |

## Local Skills (.claude/skills/)

Composite, workflow, and standalone skills that are NOT distributed via plugins:

| Skill | Purpose | Uses |
|-------|---------|------|
| solana/open-perp | Leveraged perp with technical analysis | price, trader |
| solana/dip-swap | Auto dip-buyer with budget limits | price, trader |
| travel/search-flights | Search Google Flights | browser |
| travel/search-stays | Search Airbnb for stays | browser |
| workflow/audio-story | Full pipeline: audio → story → images → video → narration | elevenlabs, replicate |
| text/translate | Translate text (default: English → Urdu) | — |
| utility/usage | Plugin usage stats from hook logs | — |

## Rules for Adding Skills

### Plugin commands vs local skills

- **Atomic skills** that use a single plugin → put in `<plugin>/commands/<name>.md`
- **Composite/workflow skills** that chain multiple plugins → put in `.claude/skills/`
- Never duplicate: one capability, one location

### No Duplication

- `audio/narrate` = batch file output. `audio/speak` = interactive playback. Different purposes.
- `image/generate` supports multiple models via `--model` flag — do NOT create separate commands per model.
- Workflows must reference plugin commands, not inline their logic.

### After Adding/Changing

```bash
# Validate plugin manifests
claude plugin validate <plugin>/.claude-plugin/plugin.json

# Update the marketplace manifest if you added a new plugin
claude plugin validate .claude-plugin/marketplace.json
```

## Defaults

- Image model: seedream (`bytedance/seedream-5-lite`)
- Voice: Achar (`Vwq3FUaRDrPephO3Qaxs`)
- Stop immediately if required API keys are missing

## Browser Automation

Uses `playwright-cli` — direct bash commands, not MCP.

- Config: `.playwright/cli.config.json` (headless, 1280x900)
- Sessions: `playwright-cli -s=<name> <command>`

## Target Platform

Claude Code CLI only. Skills go under `.claude/skills/`, plugin commands under `<plugin>/commands/`.

# hunzai/agents — AI Agent Plugins & Skills

Claude Code plugins for Solana trading, content creation, browser automation, and price analysis.

## Install Plugins

```bash
# 1. Add the marketplace (once)
claude plugin marketplace add hunzai/agents

# 2. Install any plugin
claude plugin install elevenlabs@hunzai-agents
claude plugin install replicate@hunzai-agents
claude plugin install trader@hunzai-agents
claude plugin install price@hunzai-agents
claude plugin install browser@hunzai-agents
```

Each plugin comes with CLI tools, slash commands, and agent definitions.

## Available Plugins

| Plugin | Commands | Description |
|--------|----------|-------------|
| **elevenlabs** | `/transcribe` `/narrate` `/speak` | Speech-to-text, text-to-speech, speak aloud |
| **replicate** | `/image-generate` `/video-generate` | AI images (seedream, banana) and videos (wan-video) |
| **trader** | `/trade` | Spot swap SOL/USDC + leveraged perpetuals via Jupiter |
| **price** | `/fetch-price` | Real-time prices, RSI/MACD/Bollinger signals, S/R levels |
| **browser** | `/automate` | Browser automation via playwright-cli |

## Plugin Structure

Each plugin follows the Claude Code plugin standard:

```
<plugin>/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest (name, description, keywords)
├── commands/                 # Slash commands (distributed with plugin)
│   └── <command>.md          # Command definition (frontmatter + instructions)
├── agents/                   # Subagent definitions
│   └── <agent>.md
├── vendor/                   # CLI source code
│   └── <name>/
│       ├── src/
│       ├── dist/             # Built CLI (auto-built via setup.sh)
│       └── package.json
├── scripts/
│   └── setup.sh              # Build CLI (idempotent)
└── hooks/                    # Optional lifecycle hooks
```

## Local Skills (.claude/skills/)

Composite and workflow skills that chain multiple plugins live under `.claude/skills/`:

| Skill | Description | Requires |
|-------|-------------|----------|
| solana/open-perp | Leveraged perp with technical analysis | price + trader |
| solana/dip-swap | Auto dip-buyer with budget limits | price + trader |
| travel/search-flights | Search Google Flights | browser |
| travel/search-stays | Search Airbnb for stays | browser |
| workflow/audio-story | Full content pipeline: audio → story → images → video → narration | elevenlabs + replicate |
| text/translate | Translate text (default: English → Urdu) | — |
| utility/usage | Plugin usage stats from hook logs | — |

These are loaded automatically when Claude Code runs inside this repo.

## For Plugin Developers

### Publishing to the marketplace

1. Create your plugin under `<plugin-name>/`:
   - `.claude-plugin/plugin.json` — name, description, keywords
   - `commands/<name>.md` — slash commands with frontmatter
   - `vendor/` — CLI tools (optional)
   - `scripts/setup.sh` — build script (optional)

2. Add your plugin to `.claude-plugin/marketplace.json`:
   ```json
   {
     "name": "your-plugin",
     "source": "./your-plugin",
     "description": "What it does",
     "category": "trading | media | automation | utility"
   }
   ```

3. Validate:
   ```bash
   claude plugin validate your-plugin/.claude-plugin/plugin.json
   claude plugin validate .claude-plugin/marketplace.json
   ```

4. Push to GitHub. Users install via:
   ```bash
   claude plugin marketplace add hunzai/agents
   claude plugin install your-plugin@hunzai-agents
   ```

### Command format (commands/*.md)

```markdown
---
description: >
  One line describing when to use this command.
allowed-tools: Bash(*)
---

# Command Title

Instructions for Claude Code to execute this command.
Use ${CLAUDE_PLUGIN_ROOT} to reference files within the plugin.
```

### Running your own marketplace

Fork this repo and publish your own:

```bash
# Users add your marketplace
claude plugin marketplace add your-github-user/your-repo

# Then install plugins from it
claude plugin install your-plugin@your-marketplace-name
```

## Web Marketplace

The [web/](../web/) project provides a web UI where users describe tasks in natural language. The Master Agent reads `skills.json` to plan which plugins/skills to use and executes them via the Claude Agent SDK.

```bash
cd ../web && npm install && npm run dev   # http://localhost:3000
```

## Catalog

- `skills.json` — machine-readable catalog of all skills and plugins
- `llms.txt` — plain-text catalog for LLM consumption
- `.claude-plugin/marketplace.json` — Claude Code marketplace manifest

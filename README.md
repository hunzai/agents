# Agents

A collection of Claude Code plugins. Each subdirectory is a self-contained
plugin that can be installed independently.

## Available Agents

| Agent | Description |
|-------|-------------|
| [trader](./trader/) | Solana trading agent — Jupiter Perpetuals + Spot Swap |

## Installation

Add this repo as a marketplace once, then install any agent by name:

```bash
# In a Claude Code session
/plugin marketplace add github.com/hunzai/agents
/plugin install trader@hunzai-agents
```

## Adding a New Agent

1. Create a subdirectory: `mkdir my-agent`
2. Add `.claude-plugin/plugin.json` with `{ "name": "my-agent", ... }`
3. Add `agents/`, `skills/`, and any other plugin files
4. Push — it's immediately installable via `/plugin install my-agent@hunzai-agents`

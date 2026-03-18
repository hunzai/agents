---
name: utility/usage
description: >
  Show plugin and skill usage stats — total calls, tokens, and cost estimates
  from the PostToolUse hook log. Zero overhead until invoked.
metadata:
  tier: atomic
  category: utility
  inputs: "None — reads logs/usage.log"
  outputs: "Per-plugin usage table with call counts and cost estimates"
  uses: []
  cost-estimate: "Free (local file read)"
  allowed-tools: Bash(cat:*), Bash(awk:*), Bash(sort:*), Bash(wc:*), Read(*)
---

# Usage Report

Reads `logs/usage.log` (written by the PostToolUse hook) and reports per-plugin usage.

## Log format

Each line: `timestamp|session|tool|plugin|command`

## Generate report

```bash
awk -F'|' '{plugins[$4]++} END {for (p in plugins) printf "%-15s %d calls\n", p, plugins[p]}' logs/usage.log | sort -t' ' -k2 -rn
```

## Token cost estimates

Read each plugin's `tokenProfile` from its `plugin.json` to estimate total tokens:

| Plugin | Avg output tokens/call | Typical steps/skill |
|--------|----------------------|---------------------|
| trader | 200 | 5 |
| price | 300 | 4 |
| elevenlabs | 500 | 3 |
| replicate | 150 | 2 |
| browser | 800 | 12 |

Multiply calls by avgOutputTokens for estimated total output tokens.

## Session breakdown

```bash
awk -F'|' '{sessions[$2"|"$4]++} END {for (s in sessions) printf "%s  %d calls\n", s, sessions[s]}' logs/usage.log | sort
```

## Present results

Show a summary table:

| Plugin | Calls | Est. Output Tokens | Category |
|--------|-------|-------------------|----------|

And session-level breakdown if the log has multiple sessions.

If `logs/usage.log` does not exist, report that no usage data has been collected yet.

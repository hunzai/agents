---
name: meta/create-skill
description: >
  Create a new skill following the agentskills.io specification. Generates
  SKILL.md with proper frontmatter, progressive disclosure structure, and
  optional scripts/references. Use when asked to create a skill, add a new
  capability, write a SKILL.md, or scaffold a skill folder.
metadata:
  tier: atomic
  category: meta
  inputs: "<skill-name> <description> [--plugin <plugin-name>] [--tier atomic|composite|workflow]"
  outputs: "Complete skill directory with SKILL.md and optional scripts/"
  uses: []
  cost-estimate: "~$0.01 (LLM only)"
  argument-hint: <skill-name> <description>
  allowed-tools: Bash(*) Read(*) Write(*) Glob(*)
  context: fork
---

# Create a Skill

Generate a new skill that conforms to the agentskills.io specification.

## Spec Rules (must follow)

### Name
- Max 64 chars, lowercase letters, numbers, hyphens only
- Must NOT start/end with hyphen, no consecutive hyphens
- Must match the parent directory name
- Use `category/action` format: `audio/transcribe`, `solana/trade`, `text/translate`

### Description
- Max 1024 chars
- Must describe BOTH what the skill does AND when to use it
- Use imperative phrasing: "Use this skill when..."
- Include specific trigger keywords (even implicit ones)
- Be pushy — explicitly list contexts where skill applies

### Frontmatter
```yaml
---
name: category/action
description: >
  One paragraph. What it does + when to use it. Include trigger keywords.
metadata:
  tier: atomic | composite | workflow
  category: <category>
  inputs: "<arg1> description, <arg2> description"
  outputs: "What files/data the skill produces"
  uses: [plugin1, plugin2]
  cost-estimate: "~$X.XX per run"
  argument-hint: <arg1> <arg2> [optional-arg]
  allowed-tools: Bash(*)
  context: fork
---
```

### Body Structure
1. **Title** — `# Verb + Noun` (e.g., "# Generate Image", "# Translate Text")
2. **One-line summary** — what it does
3. **Steps** — numbered, each with a clear heading
4. **Report** — final step summarizing what was produced

### Progressive Disclosure Budget
- SKILL.md body < 500 lines / ~5000 tokens
- Move detailed reference material to `references/`
- Move reusable logic to `scripts/`
- Tell agent WHEN to load each file

## Steps

### Step 1: Parse arguments

- NAME = $ARGUMENTS[0] (required — skill name in `category/action` format)
- DESCRIPTION = remaining args joined as the description
- PLUGIN = --plugin flag value (optional — which plugin this skill uses)
- TIER = --tier flag value (default: "atomic")

### Step 2: Determine placement

```
If PLUGIN is set:
  → Plugin command: <PLUGIN>/commands/<action>.md
Else:
  → Local skill: .claude/skills/<category>/<action>/SKILL.md
```

### Step 3: Check for duplicates

```bash
find .claude/skills/ -name SKILL.md | head -20
ls */commands/*.md 2>/dev/null | head -20
```

If a similar skill exists, warn and ask whether to proceed or update existing.

### Step 4: Research context

If the skill uses a plugin CLI:
1. Read the plugin's existing commands for patterns
2. Read the plugin's CLI help to understand available subcommands
3. Match the style of existing commands in that plugin

### Step 5: Write SKILL.md

Apply these quality rules:

**Add what the agent lacks, omit what it knows:**
- Focus on: project-specific conventions, domain procedures, non-obvious edge cases
- Don't explain basics the agent already knows
- Test: "Would the agent get this wrong without this instruction?" If no, cut it.

**Gotchas section:**
- Add concrete corrections to mistakes the agent will make
- Highest-value content — keep in SKILL.md body

**Provide defaults, not menus:**
- Pick one default approach, mention alternatives briefly

**Favor procedures over declarations:**
- Teach HOW to approach a class of problems, not WHAT to produce

**Validation loops where possible:**
- do work → run validator → fix issues → repeat

### Step 6: Add scripts (if needed)

If the skill needs reusable logic:
- Create `scripts/` directory
- Scripts must be non-interactive (no prompts — use CLI flags, env vars, stdin)
- Include `--help` output
- Use structured output (JSON to stdout, diagnostics to stderr)
- Pin dependency versions
- Make idempotent where possible

### Step 7: Update skills.json

Add the new skill to the appropriate category in `skills.json`:

```json
{
  "name": "category/action",
  "description": "Same as SKILL.md description",
  "path": "path/to/SKILL.md or command.md",
  "uses": ["plugin-name"],
  "cost_estimate": "~$X.XX",
  "source": "plugin" or "local"
}
```

### Step 8: Validate

- Name matches directory name
- Description is 1-1024 chars and includes trigger keywords
- Frontmatter has all required fields (name, description)
- Body is < 500 lines
- File references use relative paths
- No duplicate capabilities with existing skills

### Step 9: Report

```
Created: <path>
Name:    <name>
Tier:    <tier>
Plugin:  <plugin or "none (local skill)">
Uses:    <plugin list>
Cost:    <estimate>
```

## Gotchas

- Never create a skill that duplicates an existing one — update the existing skill instead
- Plugin commands go in `<plugin>/commands/`, NOT in `.claude/skills/`
- Always use `category/action` naming — never flat names like `my-skill`
- Description must be pushy — "Use this skill when..." with explicit trigger contexts
- Keep SKILL.md under 500 lines — move detail to references/

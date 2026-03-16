---
name: create-skill
description: >
  Guide for writing Claude Code and Cursor Agent Skills. Use when asked to
  create a skill, write a SKILL.md, add a skill to a plugin, author any skill
  following the Agent Skills standard, or when asked about skill structure,
  best practices, or SKILL.md format. Do NOT use for writing Cursor rules
  (.mdc files) or plugin manifests (plugin.json).
metadata:
  author: hunzai
  version: 1.0.0
---

# Create Skill

Writes a correct, well-structured `SKILL.md` for Claude Code plugins and Cursor.
Follow every rule below without exception. The spec is strict — apply it exactly.

---

## Hard rules (never break these)

- File MUST be named exactly `SKILL.md` — not `skill.md`, `SKILL.MD`, or anything else
- Skill folder MUST use kebab-case: `my-skill` not `MySkill` or `my_skill`
- No `README.md` inside the skill folder — all docs live in `SKILL.md` or `references/`
- YAML frontmatter MUST have opening `---` and closing `---` delimiters
- `name` must be kebab-case, lowercase only, no spaces — must match the folder name
- `description` MUST contain both WHAT the skill does AND WHEN to trigger it (with real trigger phrases users would say)
- `description` is max 1024 characters
- No XML angle brackets (`< >`) anywhere in the frontmatter
- Never name a skill with `claude` or `anthropic` as prefix (reserved by Anthropic)
- Keep `SKILL.md` under 500 lines — move detail to `references/`

---

## Folder structure

```
skill-name/
├── SKILL.md          ← required, exact casing
├── scripts/          ← optional: Bash, Python, Node executables
├── references/       ← optional: detailed docs linked from SKILL.md
└── assets/           ← optional: templates, fonts, icons
```

## Storage locations

| Surface | Path | Scope |
|---------|------|-------|
| Cursor project skill | `.cursor/skills/skill-name/` | All Claude/Cursor sessions in this repo |
| Cursor personal skill | `~/.cursor/skills/skill-name/` | Your machine, all projects |
| Claude Code plugin skill | `plugin-name/skills/skill-name/` | When plugin is installed |

**Never** write to `~/.cursor/skills-cursor/` — that is Cursor's internal system directory.

---

## YAML frontmatter

### Minimal (always valid)

```yaml
---
name: skill-name-in-kebab-case
description: What the skill does. Use when user asks to [phrase 1], [phrase 2], or [phrase 3].
---
```

### Full (use fields that are relevant)

```yaml
---
name: skill-name
description: >
  What the skill does. Use when user asks to [phrase 1], [phrase 2],
  or mentions [keyword]. Works with [file types if relevant].
license: MIT
compatibility: Requires Node 18+, ELEVENLABS_API_KEY in environment
metadata:
  author: your-name
  version: 1.0.0
  mcp-server: server-name        # if this skill enhances an MCP server
  category: productivity
  tags: [automation, workflow]
---
```

### Good vs bad descriptions

```yaml
# GOOD — specific, has triggers, states outcomes
description: >
  Fetches real-time SOL price from Pyth Network, stores history to a local
  file, and runs RSI/MACD/Bollinger composite signals. Use when asked to
  fetch SOL price, analyze price movements, run a trading signal, or check
  if SOL is at a high or low relative to recent history.

# BAD — vague, no triggers
description: Helps with price analysis.

# BAD — technical, no user-facing triggers
description: Calls the Pyth Hermes API and appends a CSV row.
```

Ask yourself: "Would a user ever say this trigger phrase naturally?" If not, rewrite it.

---

## SKILL.md body structure

```markdown
# Skill Name

One-sentence summary of what it does.

## Quick Start

The most common use case in the fewest lines possible.

## Steps

### 1. Step name
Specific action. Use exact commands — never pseudocode.

\`\`\`bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js fetch /tmp/sol_price.txt
\`\`\`

Expected output: [describe what success looks like]

### 2. Step name
...

## Options / Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--no-play` | false | Skip audio playback, save to file only |

## Examples

Concrete scenarios with exact commands.

## Errors

| Error / Message | Cause | Fix |
|---|---|---|
| `401 Unauthorized` | Invalid API key | Check ELEVENLABS_API_KEY in .env |

## References

- [api-guide.md](references/api-guide.md) — full API reference
```

---

## Writing instructions that Claude follows

Write instructions like code — specific and deterministic, not vague prose.

```markdown
# GOOD — unambiguous, Claude will follow this
CRITICAL: Before calling create_project, verify:
- Project name is non-empty
- At least one team member is assigned
- Start date is not in the past

# BAD — Claude interprets this loosely
Make sure to validate things properly before proceeding.
```

**Priority rules:**
- Put critical instructions at the TOP of the file — buried instructions get missed
- Use `## Important` or `CRITICAL:` headers for non-negotiable steps
- Use numbered steps for ordered workflows
- For validation logic that must be deterministic, write a script in `scripts/` — code is reliable; language is not
- Keep `SKILL.md` concise. The agent is smart — only add context it wouldn't already have

**Progressive disclosure:** Put essentials in `SKILL.md`, detailed reference material in `references/`. Link from `SKILL.md`:

```markdown
## Additional resources
- For complete API docs, see [references/api-guide.md](references/api-guide.md)
```

Keep references one level deep — deeply nested links may not be read.

---

## Claude Code plugin skill extras

When writing a skill inside a plugin (`plugin-name/skills/skill-name/SKILL.md`), these substitution variables are available:

| Variable | Resolves to |
|----------|-------------|
| `${CLAUDE_SKILL_DIR}` | Absolute path to this skill's folder |
| `${CLAUDE_PLUGIN_ROOT}` | Absolute path to the plugin root |
| `$ARGUMENTS` | Text passed after the slash command |

Additional frontmatter fields available only in Claude Code:

```yaml
allowed-tools: Bash(*)        # Must use filter syntax — NOT bare "Bash"
argument-hint: [text to speak]  # Square brackets — NOT angle brackets
disable-model-invocation: true  # Only user can invoke, not Claude automatically
```

Example plugin skill frontmatter:

```yaml
---
name: speak
description: Speak text aloud using ElevenLabs. Invoke with /voice:speak followed by text.
argument-hint: [text to speak]
disable-model-invocation: true
allowed-tools: Bash(*)
---
```

---

## Common patterns

### Sequential workflow (multi-step processes)

```markdown
## Workflow

### Step 1: Fetch data
\`\`\`bash
node vendor/price/dist/cli.js fetch /tmp/sol.txt
\`\`\`

### Step 2: Analyze
\`\`\`bash
node vendor/price/dist/cli.js analysis /tmp/sol.txt 4h
\`\`\`

### Step 3: Signal
\`\`\`bash
node vendor/price/dist/cli.js signal sol 120
\`\`\`
```

### Template output (consistent document format)

```markdown
## Report format

Always produce output in this structure:

\`\`\`
Price: $NNN.NN
4h change: ±N.N%
Trend: BULLISH / BEARISH / NEUTRAL
Confidence: 0.NN
Signal: [which indicators agree / disagree]
\`\`\`
```

### Decision tree (context-aware tool selection)

```markdown
## Storage decision

1. Check file type:
   - Large binary (>10 MB) → cloud storage MCP
   - Collaborative doc → Notion MCP
   - Code file → GitHub MCP
   - Temporary → local `/tmp/`

2. Execute with the chosen tool and explain why that storage was picked.
```

### Feedback loop (quality-critical tasks)

```markdown
## Build and validate

1. Build: `npm run build`
2. Validate: `npm run lint`
3. If validation fails — fix errors, run again
4. Only proceed when both pass
```

---

## Anti-patterns

| Anti-pattern | Instead |
|---|---|
| `"Use pypdf, or pdfplumber, or PyMuPDF..."` | Pick one default; mention fallback only if needed |
| `"If this is before August 2025..."` | No time-sensitive content — it will rot |
| Mixing "URL", "route", "endpoint" | Pick one term and use it everywhere |
| `helper`, `utils`, `tools` as skill names | `processing-pdfs`, `analyzing-spreadsheets` |
| Windows paths `scripts\helper.py` | Always forward slashes `scripts/helper.py` |
| Prose explanation of what code does | Let the code speak; add a comment only for non-obvious intent |

---

## Checklist before writing the file

- [ ] Folder name is kebab-case
- [ ] File will be named `SKILL.md` exactly
- [ ] Frontmatter has `---` open and `---` close
- [ ] `name` is kebab-case, lowercase, matches folder
- [ ] `description` contains WHAT + WHEN + real trigger phrases
- [ ] No `< >` anywhere in frontmatter
- [ ] Instructions are specific commands, not vague prose
- [ ] Critical instructions are at the TOP
- [ ] Error handling section included
- [ ] At least one concrete example with exact commands
- [ ] Detailed docs moved to `references/` if body is growing long
- [ ] No `README.md` inside the skill folder
- [ ] If Claude Code plugin skill: paths use `${CLAUDE_PLUGIN_ROOT}`, `allowed-tools` uses filter syntax `Bash(*)`

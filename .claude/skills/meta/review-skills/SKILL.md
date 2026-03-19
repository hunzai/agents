---
name: meta/review-skills
description: >
  Review, QA, and optimize existing skills against the agentskills.io spec.
  Checks naming, descriptions, progressive disclosure, trigger quality, and
  instruction effectiveness. Use when asked to review skills, audit quality,
  fix skill issues, optimize descriptions, or improve skill triggering.
metadata:
  tier: atomic
  category: meta
  inputs: "[skill-path] — specific skill to review, or omit to review all"
  outputs: "Review report + applied fixes"
  uses: []
  cost-estimate: "~$0.02 (LLM only)"
  argument-hint: "[skill-path]"
  allowed-tools: Bash(*) Read(*) Edit(*) Glob(*)
  context: fork
---

# Review & Optimize Skills

Audit skills against the agentskills.io specification and apply fixes.

## Checklist

Each skill is scored on these dimensions:

### 1. Name Compliance (pass/fail)
- [ ] Max 64 chars, lowercase + hyphens only
- [ ] No leading/trailing/consecutive hyphens
- [ ] Matches parent directory name
- [ ] Uses `category/action` format

### 2. Description Quality (0-10)
- [ ] Under 1024 chars
- [ ] Describes what skill does AND when to use it
- [ ] Uses imperative phrasing ("Use this skill when...")
- [ ] Includes trigger keywords for implicit cases
- [ ] Covers near-miss disambiguation (what it does NOT do)
- [ ] Would trigger on indirect/casual user requests

### 3. Progressive Disclosure (0-10)
- [ ] SKILL.md body under 500 lines
- [ ] Detailed reference material in separate files
- [ ] File references use relative paths
- [ ] Agent told WHEN to load each referenced file
- [ ] No deeply nested reference chains

### 4. Instruction Quality (0-10)
- [ ] Adds what agent lacks, omits what it knows
- [ ] Has gotchas section for common mistakes
- [ ] Provides defaults, not menus
- [ ] Favors procedures over declarations
- [ ] Includes validation loops where applicable
- [ ] Steps are numbered with clear headings

### 5. Script Quality (0-10, if scripts/ exists)
- [ ] Non-interactive (no prompts — CLI flags/env vars/stdin only)
- [ ] Has --help output
- [ ] Structured output (JSON to stdout, diagnostics to stderr)
- [ ] Pinned dependency versions
- [ ] Idempotent where possible
- [ ] Helpful error messages (what went wrong + what to try)

### 6. Metadata Completeness (pass/fail)
- [ ] tier field present (atomic/composite/workflow)
- [ ] category matches directory
- [ ] inputs/outputs documented
- [ ] uses lists required plugins
- [ ] cost-estimate present
- [ ] argument-hint present

### 7. No Duplication (pass/fail)
- [ ] No other skill covers same capability
- [ ] If overlapping, skills have clearly different purposes

## Steps

### Step 1: Discover skills

```bash
find .claude/skills/ -name SKILL.md | sort
find */commands/ -name "*.md" | sort
```

If a specific skill-path was given, review only that one.

### Step 2: Read each skill

For each SKILL.md or command .md file:
1. Read the full file
2. Score against each checklist dimension
3. Note specific issues with line references

### Step 3: Generate review report

For each skill, output:

```
## <skill-name>

| Dimension | Score | Issues |
|-----------|-------|--------|
| Name | PASS/FAIL | ... |
| Description | X/10 | ... |
| Progressive Disclosure | X/10 | ... |
| Instructions | X/10 | ... |
| Scripts | X/10 or N/A | ... |
| Metadata | PASS/FAIL | ... |
| Duplication | PASS/FAIL | ... |

**Overall: X/50**

### Fixes needed:
1. ...
2. ...
```

### Step 4: Apply fixes

For each issue found, apply the fix directly:

**Description too vague:**
- Rewrite to include trigger keywords and imperative phrasing
- Add "even if they don't explicitly mention..." clauses

**Missing gotchas:**
- Add gotchas section based on likely agent mistakes

**Too long:**
- Move detailed content to references/ directory
- Add "Read references/X.md if Y" directive

**Missing metadata:**
- Add missing fields to frontmatter

**Duplicate skills:**
- Flag for manual decision — do not auto-delete

### Step 5: Update skills.json

If any skill names, descriptions, or paths changed, update the
corresponding entry in skills.json.

### Step 6: Summary report

```
Skills reviewed:  N
Issues found:     N
Issues fixed:     N
Issues flagged:   N (need manual decision)

Top issues:
1. ...
2. ...
3. ...
```

## Scoring Guide

| Score | Meaning |
|-------|---------|
| 9-10 | Excellent — follows spec precisely, would trigger reliably |
| 7-8 | Good — minor improvements possible |
| 5-6 | Adequate — works but has clear gaps |
| 3-4 | Poor — needs significant rework |
| 1-2 | Broken — missing critical elements |

## Gotchas

- Do NOT delete skills during review — flag duplicates for manual decision
- When rewriting descriptions, avoid overfitting to specific query phrasings
- Find the general category a query represents, not the exact words
- Description changes must stay under 1024 chars
- Always preserve the skill's original intent when optimizing

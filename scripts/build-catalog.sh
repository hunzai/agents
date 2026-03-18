#!/usr/bin/env bash
# build-catalog.sh — Generate skills.json from SKILL.md frontmatter
# Single source of truth: .claude/skills/**/SKILL.md files
# Run: bash scripts/build-catalog.sh

set -euo pipefail
cd "$(dirname "$0")/.."

python3 scripts/build-catalog.py

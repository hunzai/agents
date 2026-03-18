#!/usr/bin/env python3
"""Generate skills.json from SKILL.md frontmatter files."""

import json
import os
import re
from datetime import date
from pathlib import Path

SKILLS_DIR = Path(".claude/skills")
PLUGINS_DIR = Path(".")
OUTPUT = Path("skills.json")

CATEGORY_DESCRIPTIONS = {
    "solana": "Solana trading, price analysis, and leveraged positions",
    "audio": "Speech-to-text, text-to-speech, and voice synthesis via ElevenLabs",
    "image": "AI image generation from text prompts via Replicate",
    "video": "AI video generation from images via Replicate wan-video",
    "text": "Text processing — translation, localization",
    "workflow": "Multi-skill content creation pipelines",
    "travel": "Flight search, accommodation booking via browser automation",
    "browser": "Browser UI automation via playwright-cli",
    "utility": "Monitoring, reporting, and project management",
}

TIER_TO_TYPE = {
    "atomic": "reference",
    "composite": "pipeline",
    "workflow": "workflow",
}


def parse_frontmatter(path: Path) -> dict:
    """Parse YAML frontmatter from a SKILL.md file."""
    text = path.read_text()
    match = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
    if not match:
        return {}

    fm_text = match.group(1)
    result = {}

    # Parse name
    m = re.search(r"^name:\s*(.+)", fm_text, re.MULTILINE)
    if m:
        result["name"] = m.group(1).strip()

    # Parse multi-line description
    m = re.search(r"^description:\s*>?\s*\n((?:\s+.+\n?)+)", fm_text, re.MULTILINE)
    if m:
        lines = m.group(1).strip().split("\n")
        result["description"] = " ".join(l.strip() for l in lines)
    else:
        m = re.search(r"^description:\s*(.+)", fm_text, re.MULTILINE)
        if m:
            result["description"] = m.group(1).strip()

    # Parse metadata fields (nested under metadata:)
    metadata_match = re.search(r"^metadata:\s*\n((?:\s+.+\n?)+)", fm_text, re.MULTILINE)
    if metadata_match:
        meta_text = metadata_match.group(1)
        for key in ["tier", "category", "inputs", "outputs", "cost-estimate"]:
            m = re.search(rf"^\s+{re.escape(key)}:\s*(.+)", meta_text, re.MULTILINE)
            if m:
                val = m.group(1).strip().strip('"').strip("'")
                result[key] = val

        # Parse uses list: [item1, item2]
        m = re.search(r"^\s+uses:\s*\[([^\]]*)\]", meta_text, re.MULTILINE)
        if m:
            items = [i.strip() for i in m.group(1).split(",") if i.strip()]
            result["uses"] = items
        else:
            result["uses"] = []

    return result


def load_plugins() -> dict:
    """Load plugin metadata from plugin.json files."""
    plugins = {}
    for pdir in sorted(PLUGINS_DIR.iterdir()):
        pjson = pdir / ".claude-plugin" / "plugin.json"
        if not pjson.exists():
            continue
        data = json.loads(pjson.read_text())
        plugins[data["name"]] = {
            "name": data["name"],
            "description": data.get("description", ""),
            "keywords": data.get("keywords", data.get("tags", [])),
            "category": data.get("category", ""),
        }
    return plugins


def build_catalog():
    """Build the skills.json catalog."""
    all_plugins = load_plugins()
    categories = {}

    # Discover all skill categories
    for cat_dir in sorted(SKILLS_DIR.iterdir()):
        if not cat_dir.is_dir():
            continue
        cat_name = cat_dir.name
        skills = []
        used_plugins = set()

        for skill_dir in sorted(cat_dir.iterdir()):
            if not skill_dir.is_dir():
                continue
            skill_file = skill_dir / "SKILL.md"
            if not skill_file.exists():
                continue

            fm = parse_frontmatter(skill_file)
            if not fm:
                continue

            name = fm.get("name", f"{cat_name}/{skill_dir.name}")
            tier = fm.get("tier", "atomic")
            uses = fm.get("uses", [])
            used_plugins.update(uses)

            skill_entry = {
                "name": name,
                "description": fm.get("description", ""),
                "path": str(skill_file),
                "type": TIER_TO_TYPE.get(tier, "reference"),
                "tier": tier,
                "uses": uses,
            }
            cost = fm.get("cost-estimate")
            if cost:
                skill_entry["cost_estimate"] = cost

            skills.append(skill_entry)

        if not skills:
            continue

        # Build plugin list for this category
        cat_plugins = []
        for pname in sorted(used_plugins):
            if pname in all_plugins:
                p = all_plugins[pname]
                cat_plugins.append({
                    "name": p["name"],
                    "description": p["description"],
                    "keywords": p["keywords"],
                })

        categories[cat_name] = {
            "description": CATEGORY_DESCRIPTIONS.get(cat_name, cat_name),
            "plugins": cat_plugins,
            "skills": skills,
        }

    catalog = {
        "version": "2.0",
        "generated": date.today().isoformat(),
        "repository": "https://github.com/hunzai/agents",
        "categories": categories,
    }

    OUTPUT.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")

    total_skills = sum(len(c["skills"]) for c in categories.values())
    total_cats = len(categories)
    print(f"Generated {OUTPUT} — {total_skills} skills across {total_cats} categories")


if __name__ == "__main__":
    build_catalog()

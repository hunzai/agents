---
name: travel/search-flights
description: >
  Search Google Flights for cheap flights between cities using playwright-cli.
  Opens browser, fills origin/destination/dates, reads results. Use when asked to
  find flights, book travel, compare airline prices, or "how much to fly to X".
metadata:
  tier: composite
  category: travel
  inputs: "<from> origin city, <to> destination, <dates> departure [return]"
  outputs: "Top 3-5 flights table + screenshot"
  uses: [browser]
  cost-estimate: "~$0.05 (browser automation only)"
  argument-hint: <from-city> to <to-city> <departure-date> [return-date] [direct]
  allowed-tools: Bash(playwright-cli:*), Read(*)
---

# Flight Search — Google Flights

Uses `playwright-cli` to automate Google Flights search. Uses `-q --no-screenshot`
for intermediate actions and `batch` for chained steps to minimize token usage.

## Step 1: Parse arguments

Extract: FROM, TO, DEPART, RETURN (optional), DIRECT (if "direct" or "nonstop").

## Step 2: Open Google Flights

```bash
playwright-cli -s=flights open "https://www.google.com/travel/flights?hl=en" --persistent
```

Read the snapshot to see the page state and element refs.

## Step 3: Handle cookie consent

If snapshot shows a cookie consent dialog, accept it:

```bash
playwright-cli -s=flights click <ref of "Accept all" button> -q --no-screenshot
playwright-cli -s=flights snapshot
```

## Step 4: Fill search form (batch where possible)

First, get the initial refs from the snapshot. Then use `-q --no-screenshot` for
the form-filling sequence — only snapshot after the sequence to see the results.

Set origin:
```bash
playwright-cli -s=flights click <ref of "Where from?" combobox> -q --no-screenshot
playwright-cli -s=flights fill <ref of input> "$FROM" -q --no-screenshot
```
Wait for suggestions, then snapshot to find the suggestion ref:
```bash
playwright-cli -s=flights snapshot
playwright-cli -s=flights click <ref of city suggestion> -q --no-screenshot
```

Set destination:
```bash
playwright-cli -s=flights click <ref of "Where to?" combobox> -q --no-screenshot
playwright-cli -s=flights fill <ref of input> "$TO" -q --no-screenshot
playwright-cli -s=flights snapshot
playwright-cli -s=flights click <ref of suggestion> -q --no-screenshot
```

## Step 5: Set dates

```bash
playwright-cli -s=flights snapshot
playwright-cli -s=flights fill <ref of Departure> "$DEPART" -q --no-screenshot
playwright-cli -s=flights press Enter -q --no-screenshot
```

If round trip:
```bash
playwright-cli -s=flights fill <ref of Return> "$RETURN" -q --no-screenshot
playwright-cli -s=flights press Enter -q --no-screenshot
```

Date format: `Mar 28` or `Fri, Mar 28`.

## Step 6: Search

```bash
playwright-cli -s=flights snapshot
playwright-cli -s=flights click <ref of Search/Done button> -q --no-screenshot
playwright-cli -s=flights wait 2000
```

Do NOT click "Explore destinations".

## Step 7: Filter nonstop (if requested)

```bash
playwright-cli -s=flights snapshot
playwright-cli -s=flights batch "click <ref of Stops filter>" "click <ref of Nonstop only>"
```

## Step 8: Read results

```bash
playwright-cli -s=flights scroll down -q --no-screenshot
playwright-cli -s=flights snapshot
playwright-cli -s=flights screenshot
```

## Step 9: Report

Present top 3-5 results:

| Airline | Depart | Arrive | Duration | Stops | Price |
|---------|--------|--------|----------|-------|-------|

Include cheapest direct and cheapest overall.

## Step 10: Close

```bash
playwright-cli -s=flights close
```

## Rules

1. Use `-q --no-screenshot` for all intermediate actions — only snapshot when you need new refs
2. Use `batch` for sequences where you already know the refs
3. If an action fails, take a fresh `snapshot` and re-plan with new refs
4. Execute without asking user permission
5. The snapshot is your source of truth — use screenshots only for capturing final results

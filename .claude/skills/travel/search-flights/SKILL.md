---
name: travel/search-flights
description: >
  Search Google Flights for cheap flights between cities using playwright-cli.
  Opens browser, fills origin/destination/dates, reads results.
metadata:
  category: travel
argument-hint: <from-city> to <to-city> <departure-date> [return-date] [direct]
allowed-tools: Bash(playwright-cli:*), Read(*)
---

# Flight Search — Google Flights

Uses `playwright-cli` to automate Google Flights search.

## Step 1: Parse arguments

Extract: FROM, TO, DEPART, RETURN (optional), DIRECT (if "direct" or "nonstop").

## Step 2: Open Google Flights

```bash
playwright-cli -s=flights open "https://www.google.com/travel/flights?hl=en" --persistent
```

Read the snapshot file to see the page state and element refs.

## Step 3: Handle cookie consent

If snapshot shows a cookie consent dialog, accept it:

```bash
playwright-cli -s=flights click <ref of "Accept all" button>
```

## Step 4: Set origin city

```bash
playwright-cli -s=flights click <ref of "Where from?" combobox>
playwright-cli -s=flights fill <ref of input> "$FROM"
playwright-cli -s=flights click <ref of the city suggestion>
```

## Step 5: Set destination city

```bash
playwright-cli -s=flights click <ref of "Where to?" combobox>
playwright-cli -s=flights fill <ref of input> "$TO"
playwright-cli -s=flights click <ref of suggestion>
```

## Step 6: Set dates

```bash
playwright-cli -s=flights fill <ref of Departure> "$DEPART"
playwright-cli -s=flights press Enter
```

If round trip:
```bash
playwright-cli -s=flights fill <ref of Return> "$RETURN"
playwright-cli -s=flights press Enter
```

Date format: `Mar 28` or `Fri, Mar 28`.

## Step 7: Search

Find the Search button. Do NOT click "Explore destinations".

```bash
playwright-cli -s=flights click <ref of Search button>
```

## Step 8: Filter nonstop (if requested)

```bash
playwright-cli -s=flights click <ref of "Stops" filter>
playwright-cli -s=flights click <ref of "Nonstop only">
```

## Step 9: Read results

```bash
playwright-cli -s=flights mousewheel 0 500
playwright-cli -s=flights snapshot
playwright-cli -s=flights screenshot --filename=browser/output/flights-results.png
```

## Step 10: Report

Present top 3-5 results:

| Airline | Depart | Arrive | Duration | Stops | Price |
|---------|--------|--------|----------|-------|-------|

Include cheapest direct and cheapest overall.

## Step 11: Close

```bash
playwright-cli -s=flights close
```

## Rules

1. Read the snapshot file after every command to see updated refs
2. Use `fill` for text fields — it clears before typing
3. If an action fails, read the snapshot and re-plan with new refs
4. Execute without asking user permission
5. The snapshot YAML is your source of truth — use screenshots only for visual confirmation

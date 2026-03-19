---
name: travel/search-stays
description: >
  Search Airbnb for best value-for-money stays using playwright-cli. Finds
  entire homes/apartments (no single rooms), compares price, rating, and
  amenities. Use when asked to find accommodation, places to stay, Airbnb listings,
  or "where should I stay in X" — even if they don't mention Airbnb specifically.
metadata:
  tier: composite
  category: travel
  inputs: "<city> destination, <checkin/checkout> dates, [guests] [max-price]"
  outputs: "Top 3 Airbnb listings table + screenshots"
  uses: [browser]
  cost-estimate: "~$0.05 (browser automation only)"
  argument-hint: <city> <check-in> <check-out> [guests] [max-price]
  allowed-tools: Bash(playwright-cli:*), Read(*)
---

# Airbnb Search

Uses `playwright-cli` to search Airbnb and find the best value entire homes.
Uses `-q --no-screenshot` for intermediate actions to minimize token usage.

## Step 1: Parse arguments

Extract: CITY, CHECK_IN (YYYY-MM-DD), CHECK_OUT (YYYY-MM-DD), GUESTS (default 2), MAX_PRICE (optional).

## Step 2: Build URL and open

```bash
playwright-cli -s=airbnb open "https://www.airbnb.de/s/$CITY/homes?checkin=$CHECK_IN&checkout=$CHECK_OUT&adults=$GUESTS&room_types%5B%5D=Entire%20home%2Fapt&l10n_override=en" --persistent
```

## Step 3: Handle popups

If snapshot shows cookie consent or login modal, dismiss them:

```bash
playwright-cli -s=airbnb click <ref of accept/close button> -q --no-screenshot
playwright-cli -s=airbnb snapshot
```

Repeat if another popup appears.

## Step 4: Verify filters and sort

Confirm "Entire home/apt" is active. Apply MAX_PRICE if given.
Prefer sorting by price (low to high) or "Top rated" if available.
Use `-q --no-screenshot` for filter clicks:

```bash
playwright-cli -s=airbnb click <ref of filter/sort> -q --no-screenshot
playwright-cli -s=airbnb click <ref of option> -q --no-screenshot
playwright-cli -s=airbnb snapshot
```

## Step 5: Read listings

Scroll and read listing cards (title, rating, price, amenities, superhost).

```bash
playwright-cli -s=airbnb scroll down -q --no-screenshot
playwright-cli -s=airbnb scroll down -q --no-screenshot
playwright-cli -s=airbnb snapshot
```

Repeat up to 3 times to gather ~15-20 listings.

## Step 6: Inspect top candidates

Click into 3 best listings for full details. Use `-q --no-screenshot` for navigation,
screenshot only the listing detail page:

```bash
playwright-cli -s=airbnb click <ref of listing card> -q --no-screenshot
playwright-cli -s=airbnb wait 1000
playwright-cli -s=airbnb screenshot
playwright-cli -s=airbnb snapshot
# Read details, then go back
playwright-cli -s=airbnb press Alt+ArrowLeft -q --no-screenshot
playwright-cli -s=airbnb wait 1000
playwright-cli -s=airbnb snapshot
```

## Step 7: Score and rank

| Factor | Weight |
|--------|--------|
| Price per night | 30% |
| Rating (4.5+ preferred) | 25% |
| Amenities (kitchen, wifi, washer) | 20% |
| Reviews count | 10% |
| Superhost | 10% |
| Cancellation flexibility | 5% |

Exclude: single rooms, below 4.0 rating, fewer than 5 reviews.

## Step 8: Report

Present top 3 recommendations:

| # | Property | Type | Rating | Reviews | Price/night | Total | Amenities | Why |
|---|----------|------|--------|---------|-------------|-------|-----------|-----|

Include direct Airbnb links, total cost, best overall pick, and budget pick.

## Step 9: Close

```bash
playwright-cli -s=airbnb close
```

## Rules

1. Use `-q --no-screenshot` for all intermediate actions — only snapshot when you need new refs
2. Use `batch` for sequences where you already know the refs
3. If an action fails, take a fresh `snapshot` and re-plan with new refs
4. Execute without asking user permission
5. NEVER recommend single rooms or shared spaces
6. Screenshot only listing detail pages and final results, not intermediate steps

---
name: travel/search-stays
description: >
  Search Airbnb for best value-for-money stays using playwright-cli. Finds
  entire homes/apartments (no single rooms), compares price, rating, and
  amenities. Use when asked to find accommodation, places to stay, or Airbnb listings.
metadata:
  category: travel
argument-hint: <city> <check-in> <check-out> [guests] [max-price]
allowed-tools: Bash(playwright-cli:*), Read(*)
---

# Airbnb Search

Uses `playwright-cli` to search Airbnb and find the best value entire homes.

## Step 1: Parse arguments

Extract: CITY, CHECK_IN (YYYY-MM-DD), CHECK_OUT (YYYY-MM-DD), GUESTS (default 2), MAX_PRICE (optional).

## Step 2: Build URL and open

```bash
playwright-cli -s=airbnb open "https://www.airbnb.de/s/$CITY/homes?checkin=$CHECK_IN&checkout=$CHECK_OUT&adults=$GUESTS&room_types%5B%5D=Entire%20home%2Fapt&l10n_override=en" --persistent
```

## Step 3: Handle cookie consent

```bash
playwright-cli -s=airbnb click <ref of accept/agree button>
```

## Step 4: Close login popup

If a login modal appears, dismiss it:

```bash
playwright-cli -s=airbnb click <ref of close/X button on modal>
```

## Step 5: Verify filters

Confirm "Entire home/apt" is active. Apply MAX_PRICE if given.

## Step 6: Sort by best value

Prefer sorting by price (low to high) or "Top rated" if available.

## Step 7: Read listings

Scroll and read listing cards (title, rating, price, amenities, superhost).

```bash
playwright-cli -s=airbnb mousewheel 0 800
playwright-cli -s=airbnb snapshot
```

Repeat up to 3 times to gather ~15-20 listings.

## Step 8: Inspect top candidates

Click into 3-5 best listings for full details:

```bash
playwright-cli -s=airbnb click <ref of listing card>
playwright-cli -s=airbnb screenshot --filename=browser/output/airbnb-candidate-1.png
playwright-cli -s=airbnb go-back
```

## Step 9: Score and rank

| Factor | Weight |
|--------|--------|
| Price per night | 30% |
| Rating (4.5+ preferred) | 25% |
| Amenities (kitchen, wifi, washer) | 20% |
| Reviews count | 10% |
| Superhost | 10% |
| Cancellation flexibility | 5% |

Exclude: single rooms, below 4.0 rating, fewer than 5 reviews.

## Step 10: Report

Present top 3 recommendations:

| # | Property | Type | Rating | Reviews | Price/night | Total | Amenities | Why |
|---|----------|------|--------|---------|-------------|-------|-----------|-----|

Include direct Airbnb links, total cost, best overall pick, and budget pick.

## Step 11: Close

```bash
playwright-cli -s=airbnb close
```

## Rules

1. Read the snapshot file after every command
2. Use `fill` for text fields
3. Execute without asking user permission
4. NEVER recommend single rooms or shared spaces
5. Take screenshots of top candidates

---
name: airbnb-search
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

Construct the search URL with query params to pre-fill the form:

```bash
playwright-cli -s=airbnb open "https://www.airbnb.de/s/$CITY/homes?checkin=$CHECK_IN&checkout=$CHECK_OUT&adults=$GUESTS&room_types%5B%5D=Entire%20home%2Fapt&l10n_override=en" --persistent
```

This pre-selects "Entire home/apt" and sets English locale. Read the snapshot.

## Step 3: Handle cookie consent

If the snapshot shows a cookie/privacy dialog, accept it:

```bash
playwright-cli -s=airbnb click <ref of accept/agree button>
```

## Step 4: Close login popup

Airbnb often shows a login modal on first visit. If the snapshot shows a close (X) button on a modal or dialog, dismiss it:

```bash
playwright-cli -s=airbnb click <ref of close/X button on modal>
```

## Step 5: Verify filters

Read the snapshot. Confirm "Entire home/apt" is active in the type filter. If not:

```bash
playwright-cli -s=airbnb click <ref of "Type of place" filter>
playwright-cli -s=airbnb click <ref of "Entire home/apt" checkbox>
playwright-cli -s=airbnb click <ref of "Show results" or apply button>
```

If MAX_PRICE was given, apply a price filter:

```bash
playwright-cli -s=airbnb click <ref of "Price" filter>
playwright-cli -s=airbnb fill <ref of max price input> "$MAX_PRICE"
playwright-cli -s=airbnb click <ref of apply/show button>
```

## Step 6: Sort by best value

If a sort option is visible, prefer sorting by price (low to high) or "Top rated" depending on what's available. Read the snapshot to check.

## Step 7: Read listings

Read the snapshot to extract listing cards. Each card typically shows:
- Title / property type
- Rating and review count
- Price per night / total price
- Key amenities (wifi, kitchen, parking, etc.)
- Superhost badge

Scroll down to load more results:

```bash
playwright-cli -s=airbnb mousewheel 0 800
playwright-cli -s=airbnb snapshot
```

Repeat scroll + snapshot up to 3 times to gather ~15-20 listings.

## Step 8: Inspect top candidates

For the 3-5 best-looking listings (high rating, reasonable price, entire home), click into each to get details:

```bash
playwright-cli -s=airbnb click <ref of listing card>
```

Read the snapshot for:
- Full amenities list
- House rules
- Exact location (neighborhood)
- Cancellation policy
- Total price breakdown
- Number of bedrooms/bathrooms
- Photos (take a screenshot)

```bash
playwright-cli -s=airbnb screenshot --filename=browser/output/airbnb-candidate-1.png
```

Go back to results:

```bash
playwright-cli -s=airbnb go-back
```

## Step 9: Score and rank

Rate each candidate on a value-for-money score:

| Factor | Weight |
|--------|--------|
| Price per night | 30% |
| Rating (4.5+ preferred) | 25% |
| Reviews count (more = trustworthy) | 10% |
| Amenities (kitchen, wifi, washer) | 20% |
| Superhost | 10% |
| Cancellation flexibility | 5% |

Exclude:
- Single rooms or shared spaces
- Listings below 4.0 rating
- Listings with fewer than 5 reviews (unless very new)

## Step 10: Screenshot best option

```bash
playwright-cli -s=airbnb screenshot --filename=browser/output/airbnb-best-pick.png
```

## Step 11: Report

Present top 3 recommendations:

| # | Property | Type | Rating | Reviews | Price/night | Total | Amenities | Why |
|---|----------|------|--------|---------|-------------|-------|-----------|-----|

Include:
- Direct Airbnb link for each (from the URL bar or listing ref)
- Total cost for the stay
- Best overall pick with reasoning
- Budget pick if different from best overall

## Step 12: Close

```bash
playwright-cli -s=airbnb close
```

## Rules

1. Read the snapshot file after every command to see updated refs
2. Use `fill` for text fields — it clears before typing
3. If an action fails, read the snapshot and re-plan with new refs
4. Execute without asking user permission
5. NEVER recommend single rooms or shared spaces — entire homes/apartments only
6. If a listing looks too cheap for the area, inspect it carefully for red flags (shared bathroom, sofa bed, etc.)
7. Take screenshots of the top candidates for visual confirmation

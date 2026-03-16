---
name: translate
description: >
  Translate a text file into another language (default: Urdu). Keeps English
  technical terms, acronyms, and commonly used English words as-is. Optimized
  for TTS output — short paragraphs, spoken number words, natural pauses.
  Use when asked to translate text, convert English to Urdu, or localize content.
metadata:
  category: content
disable-model-invocation: true
argument-hint: <input-file> <output-file> [language]
allowed-tools: Bash(*)
context: fork
---

# Translate Text

Translate a text file while keeping English terms that are commonly used
in the target language. Output is optimized for text-to-speech.

## Steps

### Step 1: Parse arguments

- INPUT = $ARGUMENTS[0] (required — path to .txt file)
- OUTPUT = $ARGUMENTS[1] (required — path for translated output)
- LANGUAGE = $ARGUMENTS[2] or "urdu"

### Step 2: Read input file

```bash
cat <INPUT>
```

### Step 3: Translate

Read the file content. Translate into the target language following these rules:

**Words to keep in English (never translate):**
- Finance: bank, account, loan, interest rate, inflation, deflation, GDP,
  IMF, budget, economy, policy, tax, income tax, sales tax, GST, percent,
  investment, currency, money supply, reserve, credit, debit
- Organizations: State Bank, Federal Reserve, World Bank, IMF, EOBI
- Tech: data, system, process, software, app, server, AI, API
- General: government, control, balance, result, example, level, rate,
  increase, decrease, growth, problem, solution

**Words to translate (for Urdu):**
- salary/wages → تنخواہ, money/amount → رقم, price/value → قیمت
- market → بازار, shopkeeper → دکاندار, worker → مزدور
- understand → سمجھیں, think → سوچیں, see → دیکھیں
- Use everyday words a rickshaw driver would understand

**TTS formatting rules:**
- Keep same section structure as input
- Short paragraphs (2-3 sentences) — each becomes one breath group in audio
- Empty line between paragraphs for natural TTS pauses
- Numbers as spoken words: "pachaas lakh rupay" not "5,000,000"
- English acronyms as-is (IMF, GDP, GST) — TTS reads them letter-by-letter
- Plain text only — no markdown, no special characters

### Step 4: Write output

Save the translated text to OUTPUT path.

### Step 5: Report

```
Input:    <INPUT> (N words)
Output:   <OUTPUT> (N words)
Language: <LANGUAGE>
```

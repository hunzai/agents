import { launch, getPage, closeBrowser, isSessionActive, SCREENSHOTS_DIR, LOGS_DIR, RECORDINGS_DIR } from "./session.js";
import { takeSnapshot, takeFullSnapshot, getElementByRef } from "./snapshot.js";
import { resolve, dirname, join } from "node:path";
import { mkdirSync, existsSync, appendFileSync, readdirSync } from "node:fs";

const rawArgs = process.argv.slice(2);

let sessionId: string | null = null;
const sessionIdx = rawArgs.indexOf("--session");
if (sessionIdx !== -1) {
  sessionId = rawArgs[sessionIdx + 1] || null;
  rawArgs.splice(sessionIdx, 2);
}

let recordEnabled = false;
const recordIdx = rawArgs.indexOf("--record");
if (recordIdx !== -1) {
  recordEnabled = true;
  rawArgs.splice(recordIdx, 1);
}

// Performance flags
let quietMode = false;
for (const flag of ["-q", "--quiet"]) {
  const idx = rawArgs.indexOf(flag);
  if (idx !== -1) { quietMode = true; rawArgs.splice(idx, 1); }
}

let noScreenshot = false;
const nsIdx = rawArgs.indexOf("--no-screenshot");
if (nsIdx !== -1) { noScreenshot = true; rawArgs.splice(nsIdx, 1); }

// Selector for scoped snapshots
let snapshotSelector: string | null = null;
const selIdx = rawArgs.indexOf("--selector");
if (selIdx !== -1) {
  snapshotSelector = rawArgs[selIdx + 1] || null;
  rawArgs.splice(selIdx, 2);
}

const [command, ...args] = rawArgs;

function getVideoDir(): string | undefined {
  if (!recordEnabled) return undefined;
  return getSessionDir(RECORDINGS_DIR);
}

function getSessionDir(base: string): string {
  if (sessionId) return join(base, sessionId);
  return base;
}

function nextScreenshotNum(dir: string): number {
  if (!existsSync(dir)) return 1;
  const files = readdirSync(dir).filter(f => f.endsWith(".png"));
  let max = 0;
  for (const f of files) {
    const n = parseInt(f.slice(0, 3));
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

async function autoScreenshot(label: string): Promise<string | undefined> {
  if (noScreenshot) return undefined;
  const browser = await launch();
  const page = await getPage(browser);
  const dir = getSessionDir(SCREENSHOTS_DIR);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const num = nextScreenshotNum(dir);
  const filename = `${String(num).padStart(3, "0")}-${label}.png`;
  const fullPath = join(dir, filename);
  await page.screenshot({ path: fullPath, fullPage: false });
  console.log(`Screenshot: ${fullPath}`);
  return fullPath;
}

function logAction(action: string, detail: string, screenshotPath?: string): void {
  const dir = getSessionDir(LOGS_DIR);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const logFile = join(dir, "session.jsonl");
  const entry = {
    ts: new Date().toISOString(),
    action,
    detail,
    ...(screenshotPath ? { screenshot: screenshotPath } : {}),
  };
  appendFileSync(logFile, JSON.stringify(entry) + "\n", "utf-8");
}

async function printSnap(page: import("playwright-core").Page): Promise<void> {
  if (quietMode) return;
  const snap = await takeSnapshot(page, snapshotSelector);
  console.log("\n--- Refs ---");
  console.log(snap);
}

function usage(): never {
  console.log(`Usage: node cli.js [--session <id>] [flags] <command> [args]

Commands:
  open <url>              Navigate to URL
  snapshot [full]         List interactive elements (add "full" for tree view)
  click <ref>             Click element by ref
  clicktext <text>        Click by visible text
  fill <ref> <text>       Clear + type into field
  type <ref> <text>       Append text to field
  press <key>             Press key: Enter, Tab, Escape, ArrowDown
  waitfortext <text>      Wait up to 5s for text to appear
  screenshot [path]       Save screenshot
  text                    Extract all visible text
  scroll <up|down|top|bottom>  Scroll page
  wait <ms>               Wait ms
  batch "cmd1" "cmd2" ... Execute multiple commands, one snapshot at end
  status                  Show URL and title
  close                   End session

Performance flags:
  -q, --quiet             Suppress auto-snapshot after actions (~75% token savings)
  --no-screenshot         Suppress auto-screenshot after actions
  --selector <css>        Scope snapshot to a CSS selector (e.g. "#main-content")

Other options:
  --session <id>          Group outputs under session ID
  --record                Record video (saved on close)`);
  process.exit(1);
}

if (!command) usage();

/** Execute a single action. Used by both direct calls and batch. */
async function execAction(cmd: string, cmdArgs: string[], isBatch: boolean): Promise<void> {
  const browser = await launch();
  const page = await getPage(browser);

  switch (cmd) {
    case "open": {
      let url = cmdArgs[0];
      if (!url) { console.error("Error: URL required"); process.exit(1); }
      if (!url.startsWith("http")) url = `https://${url}`;
      const vDir = getVideoDir();
      const pg = await getPage(browser, vDir);
      if (vDir) console.log(`Recording to: ${vDir}`);
      await pg.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await pg.waitForTimeout(1000);
      console.log(`URL: ${pg.url()}`);
      console.log(`Title: ${await pg.title()}`);
      if (!isBatch) {
        await printSnap(pg);
        const ssPath = await autoScreenshot("open");
        logAction("open", url + (vDir ? " [recording]" : ""), ssPath);
      } else {
        logAction("open", url);
      }
      break;
    }

    case "click": {
      const ref = parseInt(cmdArgs[0]);
      if (isNaN(ref)) { console.error("Error: ref number required"); process.exit(1); }
      const el = await getElementByRef(page, ref);
      await el.scrollIntoViewIfNeeded();
      await el.click({ timeout: 5000 });
      await page.waitForTimeout(100);
      console.log(`Clicked [${ref}]`);
      if (!isBatch) {
        console.log(`URL: ${page.url()}`);
        await printSnap(page);
        const ssPath = await autoScreenshot(`click-${ref}`);
        logAction("click", `ref=${ref}`, ssPath);
      } else {
        logAction("click", `ref=${ref}`);
      }
      break;
    }

    case "clicktext": {
      const text = cmdArgs.join(" ");
      if (!text) { console.error("Error: text required"); process.exit(1); }
      const loc = page.getByText(text, { exact: false }).first();
      await loc.scrollIntoViewIfNeeded();
      await loc.click({ timeout: 5000 });
      await page.waitForTimeout(100);
      console.log(`Clicked text: "${text}"`);
      if (!isBatch) {
        console.log(`URL: ${page.url()}`);
        await printSnap(page);
        const ssPath = await autoScreenshot("clicktext");
        logAction("clicktext", text, ssPath);
      } else {
        logAction("clicktext", text);
      }
      break;
    }

    case "fill": {
      const ref = parseInt(cmdArgs[0]);
      const text = cmdArgs.slice(1).join(" ");
      if (isNaN(ref) || !text) { console.error("Error: ref and text required"); process.exit(1); }
      const el = await getElementByRef(page, ref);
      await el.scrollIntoViewIfNeeded();
      await el.fill(text);
      await page.waitForTimeout(100);
      console.log(`Filled [${ref}] with: "${text}"`);
      if (!isBatch) {
        await printSnap(page);
        const ssPath = await autoScreenshot(`fill-${ref}`);
        logAction("fill", `ref=${ref} text="${text}"`, ssPath);
      } else {
        logAction("fill", `ref=${ref} text="${text}"`);
      }
      break;
    }

    case "type": {
      const ref = parseInt(cmdArgs[0]);
      const text = cmdArgs.slice(1).join(" ");
      if (isNaN(ref) || !text) { console.error("Error: ref and text required"); process.exit(1); }
      const el = await getElementByRef(page, ref);
      await el.scrollIntoViewIfNeeded();
      await el.type(text);
      await page.waitForTimeout(100);
      console.log(`Typed [${ref}]: "${text}"`);
      if (!isBatch) {
        await printSnap(page);
        const ssPath = await autoScreenshot(`type-${ref}`);
        logAction("type", `ref=${ref} text="${text}"`, ssPath);
      } else {
        logAction("type", `ref=${ref} text="${text}"`);
      }
      break;
    }

    case "press": {
      const key = cmdArgs[0];
      if (!key) { console.error("Error: key required"); process.exit(1); }
      await page.keyboard.press(key);
      await page.waitForTimeout(300);
      console.log(`Pressed: ${key}`);
      if (!isBatch) {
        await printSnap(page);
        const ssPath = await autoScreenshot(`press-${key}`);
        logAction("press", key, ssPath);
      } else {
        logAction("press", key);
      }
      break;
    }

    case "scroll": {
      const direction = cmdArgs[0] || "down";
      switch (direction) {
        case "down": await page.evaluate(() => window.scrollBy(0, 600)); break;
        case "up": await page.evaluate(() => window.scrollBy(0, -600)); break;
        case "top": await page.evaluate(() => window.scrollTo(0, 0)); break;
        case "bottom": await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); break;
        default: console.error(`Unknown direction: ${direction}`); process.exit(1);
      }
      await page.waitForTimeout(100);
      console.log(`Scrolled ${direction}`);
      if (!isBatch) {
        const ssPath = await autoScreenshot(`scroll-${direction}`);
        logAction("scroll", direction, ssPath);
      } else {
        logAction("scroll", direction);
      }
      break;
    }

    case "wait": {
      const ms = parseInt(cmdArgs[0]) || 1000;
      await page.waitForTimeout(ms);
      console.log(`Waited ${ms}ms`);
      logAction("wait", `${ms}ms`);
      break;
    }

    default:
      console.error(`Unknown batch sub-command: ${cmd}`);
  }
}

async function run(): Promise<void> {
  switch (command) {
    case "open":
    case "click":
    case "clicktext":
    case "fill":
    case "type":
    case "press":
    case "scroll":
    case "wait":
      await execAction(command, args, false);
      break;

    case "batch": {
      // Each arg is a quoted sub-command: batch "click 5" "fill 3 Berlin" "press Enter"
      if (!args.length) { console.error("Error: batch requires sub-commands"); process.exit(1); }
      for (const sub of args) {
        const parts = sub.split(/\s+/);
        const [subCmd, ...subArgs] = parts;
        await execAction(subCmd, subArgs, true);
      }
      // One snapshot at the end
      const browser = await launch();
      const page = await getPage(browser);
      console.log(`\nBatch: ${args.length} actions executed`);
      console.log(`URL: ${page.url()}`);
      const snap = await takeSnapshot(page, snapshotSelector);
      console.log("\n--- Refs ---");
      console.log(snap);
      const ssPath = await autoScreenshot("batch");
      logAction("batch", `${args.length} actions`, ssPath);
      break;
    }

    case "snapshot": {
      if (!isSessionActive()) { console.error("No active session. Run 'open <url>' first."); process.exit(1); }
      const browser = await launch();
      const page = await getPage(browser);
      console.log(`URL: ${page.url()}`);
      if (args[0] === "full") {
        const snap = await takeFullSnapshot(page);
        console.log("\n--- Full Page Tree ---");
        console.log(snap);
      } else {
        const snap = await takeSnapshot(page, snapshotSelector);
        console.log("\n--- Refs ---");
        console.log(snap);
      }
      logAction("snapshot", page.url());
      break;
    }

    case "waitfortext": {
      const text = args.join(" ");
      if (!text) { console.error("Error: text required"); process.exit(1); }
      const browser = await launch();
      const page = await getPage(browser);
      try {
        await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout: 5000 });
        console.log(`Found: "${text}"`);
      } catch {
        console.log(`Not found after 5s: "${text}"`);
      }
      logAction("waitfortext", text);
      break;
    }

    case "screenshot": {
      const browser = await launch();
      const page = await getPage(browser);
      let fullPath: string;
      if (args[0]) {
        fullPath = resolve(args[0]);
      } else {
        const ssDir = getSessionDir(SCREENSHOTS_DIR);
        if (!existsSync(ssDir)) mkdirSync(ssDir, { recursive: true });
        const num = nextScreenshotNum(ssDir);
        fullPath = join(ssDir, `${String(num).padStart(3, "0")}-manual.png`);
      }
      const parentDir = dirname(fullPath);
      if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });
      await page.screenshot({ path: fullPath, fullPage: false });
      console.log(`Screenshot saved: ${fullPath}`);
      console.log(`URL: ${page.url()}`);
      logAction("screenshot", fullPath);
      break;
    }

    case "text": {
      const browser = await launch();
      const page = await getPage(browser);
      const text = await page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            if (["script", "style", "noscript"].includes(tag)) return NodeFilter.FILTER_REJECT;
            const style = window.getComputedStyle(parent);
            if (style.display === "none" || style.visibility === "hidden") return NodeFilter.FILTER_REJECT;
            return node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          },
        });
        const texts: string[] = [];
        while (walker.nextNode()) {
          const t = walker.currentNode.textContent?.trim();
          if (t) texts.push(t);
        }
        return texts.join("\n");
      });
      console.log(text);
      logAction("text", `${text.length} chars extracted`);
      break;
    }

    case "status": {
      if (!isSessionActive()) {
        console.log("No active browser session.");
      } else {
        const browser = await launch();
        const page = await getPage(browser);
        console.log(`Session: active`);
        console.log(`URL: ${page.url()}`);
        console.log(`Title: ${await page.title()}`);
      }
      break;
    }

    case "close": {
      logAction("close", "session ended");
      await closeBrowser();
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      usage();
  }
}

run().catch((err) => {
  console.error(`Error: ${err.message}`);
  logAction("error", err.message);
  process.exit(1);
});

import { launch, getPage, closeBrowser, isSessionActive, SCREENSHOTS_DIR, LOGS_DIR, RECORDINGS_DIR } from "./session.js";
import { takeSnapshot, getElementByRef } from "./snapshot.js";
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

async function autoScreenshot(label: string): Promise<string> {
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

function usage(): never {
  console.log(`Usage: node cli.js [--session <id>] <command> [args]

Commands:
  open <url>              Navigate to URL (auto-screenshot)
  snapshot                Print page accessibility tree with numbered refs
  click <ref>             Click element by ref number (auto-screenshot)
  fill <ref> <text>       Clear field and type text (auto-screenshot)
  type <ref> <text>       Append text to field (auto-screenshot)
  press <key>             Press keyboard key (auto-screenshot)
  screenshot [path]       Save screenshot manually
  text                    Extract visible text from page
  scroll <direction>      Scroll page: up, down, top, bottom (auto-screenshot)
  wait <ms>               Wait for specified milliseconds
  status                  Show session status and current URL
  close                   Close browser session

Options:
  --session <id>          Group screenshots/logs/recordings under a session ID
  --record                Record browser session as video (saved on close)`);
  process.exit(1);
}

if (!command) usage();

async function run(): Promise<void> {
  switch (command) {
    case "open": {
      let url = args[0];
      if (!url) { console.error("Error: URL required"); process.exit(1); }
      if (!url.startsWith("http")) url = `https://${url}`;

      const browser = await launch();
      const vDir = getVideoDir();
      const page = await getPage(browser, vDir);
      if (vDir) console.log(`Recording to: ${vDir}`);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(1000);
      console.log(`Navigated to: ${page.url()}`);
      console.log(`Title: ${await page.title()}`);
      const snap = await takeSnapshot(page);
      console.log("\n--- Page Snapshot ---");
      console.log(snap);
      const ssPath = await autoScreenshot("open");
      logAction("open", url + (vDir ? " [recording]" : ""), ssPath);
      break;
    }

    case "snapshot": {
      if (!isSessionActive()) { console.error("No active session. Run 'open <url>' first."); process.exit(1); }
      const browser = await launch();
      const page = await getPage(browser);
      console.log(`URL: ${page.url()}`);
      console.log(`Title: ${await page.title()}`);
      const snap = await takeSnapshot(page);
      console.log("\n--- Page Snapshot ---");
      console.log(snap);
      logAction("snapshot", page.url());
      break;
    }

    case "click": {
      const ref = parseInt(args[0]);
      if (isNaN(ref)) { console.error("Error: ref number required"); process.exit(1); }
      const browser = await launch();
      const page = await getPage(browser);
      const el = await getElementByRef(page, ref);
      await el.click();
      await page.waitForTimeout(500);
      console.log(`Clicked ref [${ref}]`);
      console.log(`URL: ${page.url()}`);
      const snap = await takeSnapshot(page);
      console.log("\n--- Page Snapshot ---");
      console.log(snap);
      const ssPath = await autoScreenshot(`click-${ref}`);
      logAction("click", `ref=${ref}`, ssPath);
      break;
    }

    case "fill": {
      const ref = parseInt(args[0]);
      const text = args.slice(1).join(" ");
      if (isNaN(ref) || !text) { console.error("Error: ref and text required"); process.exit(1); }
      const browser = await launch();
      const page = await getPage(browser);
      const el = await getElementByRef(page, ref);
      await el.fill(text);
      await page.waitForTimeout(300);
      console.log(`Filled ref [${ref}] with: "${text}"`);
      const ssPath = await autoScreenshot(`fill-${ref}`);
      logAction("fill", `ref=${ref} text="${text}"`, ssPath);
      break;
    }

    case "type": {
      const ref = parseInt(args[0]);
      const text = args.slice(1).join(" ");
      if (isNaN(ref) || !text) { console.error("Error: ref and text required"); process.exit(1); }
      const browser = await launch();
      const page = await getPage(browser);
      const el = await getElementByRef(page, ref);
      await el.type(text);
      await page.waitForTimeout(300);
      console.log(`Typed into ref [${ref}]: "${text}"`);
      const ssPath = await autoScreenshot(`type-${ref}`);
      logAction("type", `ref=${ref} text="${text}"`, ssPath);
      break;
    }

    case "press": {
      const key = args[0];
      if (!key) { console.error("Error: key required (Enter, Tab, Escape, etc.)"); process.exit(1); }
      const browser = await launch();
      const page = await getPage(browser);
      await page.keyboard.press(key);
      await page.waitForTimeout(300);
      console.log(`Pressed: ${key}`);
      const ssPath = await autoScreenshot(`press-${key}`);
      logAction("press", key, ssPath);
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
        const body = document.body;
        const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
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

    case "scroll": {
      const direction = args[0] || "down";
      const browser = await launch();
      const page = await getPage(browser);
      switch (direction) {
        case "down": await page.evaluate(() => window.scrollBy(0, 600)); break;
        case "up": await page.evaluate(() => window.scrollBy(0, -600)); break;
        case "top": await page.evaluate(() => window.scrollTo(0, 0)); break;
        case "bottom": await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); break;
        default: console.error(`Unknown direction: ${direction}. Use: up, down, top, bottom`); process.exit(1);
      }
      await page.waitForTimeout(300);
      console.log(`Scrolled ${direction}`);
      const ssPath = await autoScreenshot(`scroll-${direction}`);
      logAction("scroll", direction, ssPath);
      break;
    }

    case "wait": {
      const ms = parseInt(args[0]) || 1000;
      const browser = await launch();
      const page = await getPage(browser);
      await page.waitForTimeout(ms);
      console.log(`Waited ${ms}ms`);
      logAction("wait", `${ms}ms`);
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

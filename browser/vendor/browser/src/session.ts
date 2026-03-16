import { chromium, type Browser } from "playwright-core";
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = join(__dirname, "..", "..", "..");
const SESSION_DIR = join(PLUGIN_ROOT, ".session");
const SESSION_FILE = join(SESSION_DIR, "session.json");
const PROFILE_DIR = join(SESSION_DIR, "profile");
export const SCREENSHOTS_DIR = join(PLUGIN_ROOT, "screenshots");
export const LOGS_DIR = join(PLUGIN_ROOT, "logs");
export const RECORDINGS_DIR = join(PLUGIN_ROOT, "recordings");
export const PLUGIN_ROOT_PATH = PLUGIN_ROOT;

interface SessionInfo {
  pid: number;
  port: number;
}

function ensureSessionDir(): void {
  if (!existsSync(SESSION_DIR)) {
    mkdirSync(SESSION_DIR, { recursive: true });
  }
}

function readSession(): SessionInfo | null {
  if (!existsSync(SESSION_FILE)) return null;
  try {
    return JSON.parse(readFileSync(SESSION_FILE, "utf-8"));
  } catch {
    return null;
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForCDP(port: number, timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch { /* not ready yet */ }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Chromium CDP not reachable on port ${port} after ${timeoutMs}ms`);
}

export async function launch(headless = true): Promise<Browser> {
  ensureSessionDir();

  const session = readSession();
  if (session && isProcessAlive(session.pid)) {
    try {
      const browser = await chromium.connectOverCDP(`http://127.0.0.1:${session.port}`);
      return browser;
    } catch {
      // stale session, will re-launch below
    }
  }

  const execPath = chromium.executablePath();
  if (!execPath || !existsSync(execPath)) {
    throw new Error(
      "Chromium not found. Run: npx playwright-core install chromium"
    );
  }

  const port = 9222 + Math.floor(Math.random() * 100);

  if (!existsSync(PROFILE_DIR)) mkdirSync(PROFILE_DIR, { recursive: true });

  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${PROFILE_DIR}`,
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
  ];
  if (headless) args.push("--headless=new");

  const proc = spawn(execPath, args, {
    detached: true,
    stdio: "ignore",
  });
  proc.unref();

  if (!proc.pid) throw new Error("Failed to spawn Chromium process");

  writeFileSync(SESSION_FILE, JSON.stringify({ pid: proc.pid, port }), "utf-8");
  await waitForCDP(port);

  return await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
}

export async function getPage(
  browser: Browser,
  videoDir?: string,
): Promise<import("playwright-core").Page> {
  const contexts = browser.contexts();
  for (const ctx of contexts) {
    const pages = ctx.pages();
    if (pages.length > 0) return pages[0];
  }

  const contextOptions: Record<string, unknown> = {
    viewport: { width: 1280, height: 900 },
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  if (videoDir) {
    if (!existsSync(videoDir)) mkdirSync(videoDir, { recursive: true });
    contextOptions.recordVideo = { dir: videoDir, size: { width: 1280, height: 900 } };
  }

  const context = await browser.newContext(contextOptions);
  return await context.newPage();
}

export async function closeBrowser(): Promise<void> {
  const session = readSession();
  if (!session) {
    console.log("No active browser session.");
    return;
  }

  if (isProcessAlive(session.pid)) {
    try {
      const browser = await chromium.connectOverCDP(`http://127.0.0.1:${session.port}`);
      for (const ctx of browser.contexts()) {
        const pages = ctx.pages();
        for (const page of pages) {
          const video = page.video();
          if (video) {
            const path = await video.path().catch(() => null);
            if (path) console.log(`Video saved: ${path}`);
          }
        }
        await ctx.close();
      }
    } catch { /* connection may fail if already dying */ }

    try {
      process.kill(session.pid, "SIGTERM");
    } catch { /* already gone */ }
  }

  try { unlinkSync(SESSION_FILE); } catch { /* already gone */ }
  console.log("Browser closed.");
}

export function isSessionActive(): boolean {
  const session = readSession();
  return !!session && isProcessAlive(session.pid);
}

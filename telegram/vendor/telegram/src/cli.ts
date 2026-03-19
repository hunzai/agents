/**
 * Telegram Bot CLI — send text, photos, documents, audio, video.
 *
 * Usage:
 *   node dist/cli.js send-text <message>
 *   node dist/cli.js send-photo <file-path> [--caption text]
 *   node dist/cli.js send-document <file-path> [--caption text]
 *   node dist/cli.js send-audio <file-path> [--caption text]
 *   node dist/cli.js send-video <file-path> [--caption text]
 *   node dist/cli.js send-media <file-path> [--caption text]
 *   node dist/cli.js help
 *
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_USER_ID
 */

declare const process: { env: Record<string, string | undefined>; argv: string[]; exit(code: number): never };
declare function fetch(url: string, init?: { method?: string; headers?: Record<string, string>; body?: any }): Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
declare function require(m: string): any;

const fs = require("fs") as any;
const pathMod = require("path") as any;

const BASE = "https://api.telegram.org";

function getConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_USER_ID;
  const missing = [
    !token && "TELEGRAM_BOT_TOKEN",
    !chatId && "TELEGRAM_USER_ID",
  ].filter(Boolean);
  if (missing.length) {
    console.log(JSON.stringify({ success: false, error: `Missing env: ${missing.join(", ")}` }));
    process.exit(1);
  }
  return { token: token!, chatId: chatId! };
}

function parseArgs(args: string[]) {
  const command = args[0] ?? "help";
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      flags[args[i].slice(2)] = args[++i];
    } else {
      positional.push(args[i]);
    }
  }
  return { command, positional, flags };
}

async function apiPost(token: string, method: string, body: Record<string, string>): Promise<unknown> {
  const url = `${BASE}/bot${token}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return { success: false, error: data };
  return { success: true, message_id: (data as any).result?.message_id };
}

async function apiPostFile(
  token: string,
  method: string,
  fieldName: string,
  filePath: string,
  extra: Record<string, string>
): Promise<unknown> {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = pathMod.basename(filePath);

  const form = new FormData();
  form.append(fieldName, new Blob([fileBuffer]), fileName);
  for (const [k, v] of Object.entries(extra)) {
    form.append(k, v);
  }

  const url = `${BASE}/bot${token}/${method}`;
  const res = await fetch(url, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) return { success: false, error: data };
  return { success: true, message_id: (data as any).result?.message_id };
}

async function sendText(message: string) {
  const { token, chatId } = getConfig();
  const chunks: string[] = [];
  for (let i = 0; i < message.length; i += 4000) {
    chunks.push(message.slice(i, i + 4000));
  }
  const results = [];
  for (const chunk of chunks) {
    results.push(await apiPost(token, "sendMessage", {
      chat_id: chatId,
      text: chunk,
      parse_mode: "Markdown",
    }));
  }
  console.log(JSON.stringify(results.length === 1 ? results[0] : { success: results.every((r: any) => r.success), messages: results }));
}

async function sendFile(type: "photo" | "document" | "audio" | "video", filePath: string, caption?: string) {
  const { token, chatId } = getConfig();
  if (!fs.existsSync(filePath)) {
    console.log(JSON.stringify({ success: false, error: `File not found: ${filePath}` }));
    return;
  }
  const methodMap = { photo: "sendPhoto", document: "sendDocument", audio: "sendAudio", video: "sendVideo" };
  const extra: Record<string, string> = { chat_id: chatId };
  if (caption) extra.caption = caption;
  const result = await apiPostFile(token, methodMap[type], type, filePath, extra);
  console.log(JSON.stringify(result));
}

function detectMediaType(filePath: string): "photo" | "document" | "audio" | "video" {
  const ext = pathMod.extname(filePath).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) return "photo";
  if ([".mp3", ".wav", ".ogg", ".m4a", ".flac"].includes(ext)) return "audio";
  if ([".mp4", ".webm", ".mov", ".avi"].includes(ext)) return "video";
  return "document";
}

function printHelp() {
  console.log(`Telegram Bot CLI

Usage:
  cli.js send-text <message>
  cli.js send-photo <file> [--caption text]
  cli.js send-document <file> [--caption text]
  cli.js send-audio <file> [--caption text]
  cli.js send-video <file> [--caption text]
  cli.js send-media <file> [--caption text]   (auto-detects type)
  cli.js help

Env:
  TELEGRAM_BOT_TOKEN  — from @BotFather on Telegram
  TELEGRAM_USER_ID    — your numeric user/chat ID
`);
}

async function main() {
  const { command, positional, flags } = parseArgs(process.argv.slice(2));
  switch (command) {
    case "send-text":
      if (!positional.length) { console.error("Usage: send-text <message>"); process.exit(1); }
      await sendText(positional.join(" "));
      break;
    case "send-photo":
      if (!positional.length) { console.error("Usage: send-photo <file>"); process.exit(1); }
      await sendFile("photo", positional[0], flags.caption);
      break;
    case "send-document":
      if (!positional.length) { console.error("Usage: send-document <file>"); process.exit(1); }
      await sendFile("document", positional[0], flags.caption);
      break;
    case "send-audio":
      if (!positional.length) { console.error("Usage: send-audio <file>"); process.exit(1); }
      await sendFile("audio", positional[0], flags.caption);
      break;
    case "send-video":
      if (!positional.length) { console.error("Usage: send-video <file>"); process.exit(1); }
      await sendFile("video", positional[0], flags.caption);
      break;
    case "send-media":
      if (!positional.length) { console.error("Usage: send-media <file>"); process.exit(1); }
      await sendFile(detectMediaType(positional[0]), positional[0], flags.caption);
      break;
    default:
      printHelp();
  }
}

main().catch((e) => {
  console.error(JSON.stringify({ success: false, error: String(e) }));
  process.exit(1);
});

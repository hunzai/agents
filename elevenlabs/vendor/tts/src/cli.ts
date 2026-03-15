#!/usr/bin/env node
import "dotenv/config";
import { TtsService, VOICES, MODELS } from "./TtsService.js";
import type { SpeakOptions } from "./types.js";

const USAGE = `
ElevenLabs TTS CLI — speak text aloud using ElevenLabs voice AI

Usage:
  cli.js speak <text> [options]    Convert text to speech and play it
  cli.js voices                    List available voices
  cli.js models                    List available models

Options:
  --voice <id>      Voice ID  (default: JBFqnCBsd6RMkjVDRZzb / George)
  --model <id>      Model ID  (default: eleven_flash_v2_5)
  --output <path>   Output file (default: /tmp/voice-speech.mp3)
  --no-play         Save to file only, skip audio playback

Examples:
  cli.js speak "Hello world"
  cli.js speak "Hello world" --voice EXAVITQu4vr4xnSDxMaL
  cli.js speak "Hello world" --model eleven_multilingual_v2 --output /tmp/out.mp3
  cli.js speak "Hello world" --no-play
`.trim();

interface ParsedArgs {
  command: string;
  positionals: string[];
  flags: Record<string, string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const command = args[0] ?? "help";
  const positionals: string[] = [];
  const flags: Record<string, string> = {};

  let i = 1;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i += 2;
      } else {
        flags[key] = "true";
        i += 1;
      }
    } else {
      positionals.push(arg);
      i += 1;
    }
  }

  return { command, positionals, flags };
}

async function main(): Promise<void> {
  const { command, positionals, flags } = parseArgs(process.argv);

  if (command === "help" || flags["help"] === "true") {
    console.log(USAGE);
    process.exit(0);
  }

  if (command === "voices") {
    console.log(JSON.stringify(VOICES, null, 2));
    process.exit(0);
  }

  if (command === "models") {
    console.log(JSON.stringify(MODELS, null, 2));
    process.exit(0);
  }

  if (command === "speak") {
    const text = positionals.join(" ").trim();
    if (!text) {
      console.error("Error: no text provided.\n\n" + USAGE);
      process.exit(1);
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error("Error: ELEVENLABS_API_KEY is not set. Add it to .env");
      process.exit(1);
    }

    const options: SpeakOptions = {
      voice: flags["voice"],
      model: flags["model"],
      output: flags["output"],
      play: flags["no-play"] !== "true",
    };

    const service = new TtsService(apiKey);
    const result = await service.speak(text, options);
    console.log(JSON.stringify(result));
    process.exit(0);
  }

  console.error(`Unknown command: ${command}\n\n${USAGE}`);
  process.exit(1);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[tts] Fatal: ${message}`);
  process.exit(1);
});

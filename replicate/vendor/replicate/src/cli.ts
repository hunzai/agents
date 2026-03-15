#!/usr/bin/env node
import "dotenv/config";
import { runBanana } from "./banana.js";
import type { AspectRatio, Resolution, OutputFormat } from "./banana.js";

const USAGE = `
Replicate CLI — AI image and media generation

Usage:
  cli.js banana <input-dir> <output-dir> [options]

Commands:
  banana   Generate images from .txt prompt files using google/nano-banana-pro

Options for banana:
  --aspect-ratio <ratio>   1:1 | 4:3 | 3:4 | 16:9 | 9:16  (default: 4:3)
  --resolution <res>       1K | 2K                          (default: 2K)
  --format <fmt>           jpg | png | webp                 (default: jpg)
  --force                  Overwrite existing images

Examples:
  cli.js banana ./prompts/ ./images/
  cli.js banana ./prompts/ ./images/ --aspect-ratio 16:9 --format png
  cli.js banana ./prompts/ ./images/ --resolution 1K --force
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

  if (command === "banana") {
    const [inputDir, outputDir] = positionals;
    if (!inputDir || !outputDir) {
      console.error("Error: input-dir and output-dir are required.\n\n" + USAGE);
      process.exit(1);
    }
    await runBanana({
      inputDir,
      outputDir,
      aspectRatio: (flags["aspect-ratio"] ?? "4:3") as AspectRatio,
      resolution: (flags["resolution"] ?? "2K") as Resolution,
      outputFormat: (flags["format"] ?? "jpg") as OutputFormat,
      force: flags["force"] === "true",
    });
    return;
  }

  console.error(`Unknown command: ${command}\n\n${USAGE}`);
  process.exit(1);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[replicate] Fatal: ${message}`);
  process.exit(1);
});

#!/usr/bin/env node
import "dotenv/config";
import { runStt } from "./stt.js";
import { runTts, DEFAULT_VOICE_ID, DEFAULT_MODEL, DEFAULT_FORMAT } from "./tts.js";
import { runCombine } from "./combine.js";

const USAGE = `
ElevenLabs CLI — batch Speech-to-Text, Text-to-Speech, and combine

Usage:
  cli.js stt     <input-dir> [output-dir] [--force]
  cli.js combine <transcribe-dir> <output-file> [--force]
  cli.js tts     <input-dir> [output-dir] [--voice ID] [--model ID] [--format FMT] [--force]

Commands:
  stt      Transcribe audio files to one .txt per audio file
  combine  Merge all .txt files in a dir into a single combined file
  tts      Convert .txt files to audio (one file per .txt)

Options for stt:
  --force          Re-transcribe files that already have output

Options for combine:
  --force          Overwrite existing output file

Options for tts:
  --voice <id>     Voice ID          (default: ${DEFAULT_VOICE_ID} / George)
  --model <id>     Model ID          (default: ${DEFAULT_MODEL})
  --format <fmt>   Output format     (default: ${DEFAULT_FORMAT})
  --force          Re-synthesize files that already have output

Supported audio formats: flac, wav, mp3, ogg, opus, m4a, webm

Examples:
  cli.js stt ./recordings/
  cli.js stt ./recordings/ ./transcripts/ --force
  cli.js combine ./transcripts/ ./output/transcript.txt
  cli.js tts ./transcripts/
  cli.js tts ./transcripts/ ./audio/
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

  if (command === "stt") {
    const inputDir = positionals[0];
    if (!inputDir) {
      console.error("Error: input-dir is required.\n\n" + USAGE);
      process.exit(1);
    }
    await runStt({
      inputDir,
      outputDir: positionals[1],
      force: flags["force"] === "true",
    });
    return;
  }

  if (command === "combine") {
    const [transcribeDir, outputFile] = positionals;
    if (!transcribeDir || !outputFile) {
      console.error("Error: transcribe-dir and output-file are required.\n\n" + USAGE);
      process.exit(1);
    }
    runCombine({
      transcribeDir,
      outputFile,
      force: flags["force"] === "true",
    });
    return;
  }

  if (command === "tts") {
    const inputDir = positionals[0];
    if (!inputDir) {
      console.error("Error: input-dir is required.\n\n" + USAGE);
      process.exit(1);
    }
    await runTts({
      inputDir,
      outputDir: positionals[1],
      voiceId: flags["voice"] ?? DEFAULT_VOICE_ID,
      modelId: flags["model"] ?? DEFAULT_MODEL,
      outputFormat: flags["format"] ?? DEFAULT_FORMAT,
      force: flags["force"] === "true",
    });
    return;
  }

  console.error(`Unknown command: ${command}\n\n${USAGE}`);
  process.exit(1);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[elevenlabs] Fatal: ${message}`);
  process.exit(1);
});

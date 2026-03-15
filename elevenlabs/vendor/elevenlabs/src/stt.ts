import "dotenv/config";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import * as fs from "fs";
import * as path from "path";

const SUPPORTED = new Set([".flac", ".wav", ".mp3", ".ogg", ".opus", ".m4a", ".webm"]);

export async function runStt(opts: {
  inputDir: string;
  outputDir?: string;
  force: boolean;
}): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set. Add it to .env");

  const client = new ElevenLabsClient({ apiKey });
  const outDir = opts.outputDir ?? path.join(path.dirname(opts.inputDir), "transcribe");

  fs.mkdirSync(outDir, { recursive: true });

  const audioFiles = fs
    .readdirSync(opts.inputDir)
    .filter((f) => SUPPORTED.has(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => path.join(opts.inputDir, f));

  if (!audioFiles.length) {
    console.log(`No audio files found in ${opts.inputDir}`);
    return;
  }

  console.log(`Input:  ${opts.inputDir}`);
  console.log(`Output: ${outDir}`);
  console.log();

  for (const audioPath of audioFiles) {
    const name = path.basename(audioPath);
    const stem = path.basename(audioPath, path.extname(audioPath));
    const outFile = path.join(outDir, stem + ".txt");

    if (fs.existsSync(outFile) && !opts.force) {
      console.log(`[skip]  ${name}  (already transcribed)`);
      continue;
    }

    process.stdout.write(`[send]  ${name} ... `);
    try {
      const fileBuffer = fs.readFileSync(audioPath);
      const blob = new Blob([fileBuffer]);

      const result = await (client.speechToText as any).convert({
        file: blob,
        modelId: "scribe_v2",
        tagAudioEvents: false,
        diarize: false,
      });

      const text: string = (result.text ?? "").trim();
      fs.writeFileSync(outFile, text, "utf-8");
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      console.log(`${wordCount} words → ${path.basename(outFile)}`);
    } catch (e) {
      console.log(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

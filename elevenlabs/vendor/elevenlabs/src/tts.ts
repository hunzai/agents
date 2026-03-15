import "dotenv/config";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import * as fs from "fs";
import * as path from "path";

export const DEFAULT_VOICE_ID = "Vwq3FUaRDrPephO3Qaxs"; // Achar
export const DEFAULT_MODEL = "eleven_multilingual_v2";
export const DEFAULT_FORMAT = "mp3_44100_128";

function extForFormat(fmt: string): string {
  if (fmt.startsWith("mp3")) return "mp3";
  if (fmt.startsWith("pcm")) return "pcm";
  if (fmt.startsWith("ulaw")) return "ulaw";
  return fmt.split("_")[0] ?? "mp3";
}

export async function runTts(opts: {
  inputDir: string;
  outputDir?: string;
  voiceId: string;
  modelId: string;
  outputFormat: string;
  force: boolean;
}): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set. Add it to .env");

  const client = new ElevenLabsClient({ apiKey });
  const ext = extForFormat(opts.outputFormat);
  const outDir = opts.outputDir ?? path.join(path.dirname(opts.inputDir), "audio");

  fs.mkdirSync(outDir, { recursive: true });

  const txtFiles = fs
    .readdirSync(opts.inputDir)
    .filter((f) => path.extname(f).toLowerCase() === ".txt")
    .sort()
    .map((f) => path.join(opts.inputDir, f));

  if (!txtFiles.length) {
    console.log(`No .txt files found in ${opts.inputDir}`);
    return;
  }

  console.log(`Input:  ${opts.inputDir}`);
  console.log(`Output: ${outDir}`);
  console.log(`Voice:  ${opts.voiceId}`);
  console.log();

  for (const txtPath of txtFiles) {
    const name = path.basename(txtPath);
    const stem = path.basename(txtPath, ".txt");
    const outFile = path.join(outDir, stem + "." + ext);

    if (fs.existsSync(outFile) && !opts.force) {
      console.log(`[skip]  ${name}  (already synthesized)`);
      continue;
    }

    const text = fs.readFileSync(txtPath, "utf-8").trim();
    if (!text) {
      console.log(`[skip]  ${name}  (empty file)`);
      continue;
    }

    process.stdout.write(`[send]  ${name} ... `);
    try {
      const stream = await (client.textToSpeech as any).stream(opts.voiceId, {
        text,
        modelId: opts.modelId,
        outputFormat: opts.outputFormat,
      });

      const chunks: Buffer[] = [];
      for await (const chunk of stream as AsyncIterable<Uint8Array>) {
        chunks.push(Buffer.from(chunk));
      }
      fs.writeFileSync(outFile, Buffer.concat(chunks));
      console.log(`→ ${path.basename(outFile)}`);
    } catch (e) {
      console.log(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

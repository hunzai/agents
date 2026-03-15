import "dotenv/config";
import Replicate from "replicate";
import * as fs from "fs";
import * as path from "path";

const MODEL = "google/nano-banana-pro" as const;

export type AspectRatio = "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "match_input_image";
export type Resolution = "1K" | "2K";
export type OutputFormat = "jpg" | "png" | "webp";

async function saveOutput(output: unknown, outPath: string): Promise<void> {
  // Replicate returns FileOutput — has .url() method and is async-iterable
  const fileOutput = output as { url: () => URL; [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array> };

  if (typeof fileOutput.url === "function") {
    const url = fileOutput.url().href;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download image: ${res.status} ${res.statusText}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buffer);
    return;
  }

  // Fallback: async-iterable chunks
  if (fileOutput[Symbol.asyncIterator]) {
    const chunks: Buffer[] = [];
    for await (const chunk of fileOutput as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    fs.writeFileSync(outPath, Buffer.concat(chunks));
    return;
  }

  throw new Error(`Unexpected output type: ${typeof output}`);
}

export async function runBanana(opts: {
  inputDir: string;
  outputDir: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  outputFormat: OutputFormat;
  force: boolean;
}): Promise<void> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is not set. Get one at https://replicate.com/account");

  const replicate = new Replicate({ auth: token });

  const promptFiles = fs
    .readdirSync(opts.inputDir)
    .filter((f) => path.extname(f).toLowerCase() === ".txt")
    .sort()
    .map((f) => path.join(opts.inputDir, f));

  if (!promptFiles.length) {
    console.log(`No .txt prompt files found in ${opts.inputDir}`);
    process.exit(1);
  }

  fs.mkdirSync(opts.outputDir, { recursive: true });

  console.log(`Input:  ${opts.inputDir}  (${promptFiles.length} prompts)`);
  console.log(`Output: ${opts.outputDir}`);
  console.log(`Model:  ${MODEL}  ${opts.resolution} ${opts.aspectRatio} .${opts.outputFormat}`);
  console.log();

  for (const promptFile of promptFiles) {
    const prompt = fs.readFileSync(promptFile, "utf-8").trim();
    if (!prompt) {
      console.log(`[skip]  ${path.basename(promptFile)}  (empty prompt)`);
      continue;
    }

    const stem = path.basename(promptFile, ".txt");
    const outPath = path.join(opts.outputDir, `${stem}.${opts.outputFormat}`);

    if (fs.existsSync(outPath) && !opts.force) {
      console.log(`[skip]  ${path.basename(outPath)}`);
      continue;
    }

    process.stdout.write(`[gen]   ${path.basename(promptFile)} → ${path.basename(outPath)} ... `);
    try {
      const output = await replicate.run(MODEL, {
        input: {
          prompt,
          resolution: opts.resolution,
          aspect_ratio: opts.aspectRatio,
          output_format: opts.outputFormat,
        },
      });

      await saveOutput(output, outPath);
      const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
      console.log(`done (${sizeKb} KB)`);
    } catch (e) {
      console.log(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

/**
 * Seedream 5.0 lite — bytedance/seedream-5-lite
 * $0.035 per image. Supports text rendering, Urdu/multilingual labels,
 * infographic diagrams, and photorealistic generation.
 *
 * API differences vs banana:
 *  - output: string[] (array of URIs), not a single FileOutput
 *  - size param: "2K" | "3K" (not "resolution")
 *  - additional aspect ratios: "3:2" | "2:3" | "21:9"
 *  - output_format: "jpg" | "png" only (no webp)
 */

import "dotenv/config";
import Replicate from "replicate";
import * as fs from "fs";
import * as path from "path";

const MODEL = "bytedance/seedream-5-lite" as const;

export type SeedreamAspectRatio =
  | "1:1" | "4:3" | "3:4" | "16:9" | "9:16"
  | "3:2" | "2:3" | "21:9" | "match_input_image";

export type SeedreamSize = "2K" | "3K";
export type SeedreamFormat = "jpg" | "png";

export async function runSeedream(opts: {
  inputDir: string;
  outputDir: string;
  aspectRatio: SeedreamAspectRatio;
  size: SeedreamSize;
  outputFormat: SeedreamFormat;
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
  console.log(`Model:  ${MODEL}  ${opts.size} ${opts.aspectRatio} .${opts.outputFormat}`);
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
      // Seedream returns string[] — array of image URIs
      const output = await replicate.run(MODEL, {
        input: {
          prompt,
          size: opts.size,
          aspect_ratio: opts.aspectRatio,
          output_format: opts.outputFormat,
        },
      }) as string[];

      const uri = Array.isArray(output) ? output[0] : (output as unknown as string);
      if (!uri) throw new Error("No output URI returned from model");

      const res = await fetch(uri);
      if (!res.ok) throw new Error(`Failed to download image: ${res.status} ${res.statusText}`);

      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outPath, buffer);

      const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
      console.log(`done (${sizeKb} KB)`);
    } catch (e) {
      console.log(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

/**
 * Wan 2.2 I2V Fast — wan-video/wan-2.2-i2v-fast
 * Image-to-video generation. Takes an image + prompt, outputs .mp4.
 *
 * Pairing convention: for each image file (e.g. 01-inflation.jpg),
 * looks for a matching .txt file with the same stem (01-inflation.txt)
 * in the same directory to use as the prompt.
 */

import "dotenv/config";
import Replicate from "replicate";
import * as fs from "fs";
import * as path from "path";

const MODEL = "wan-video/wan-2.2-i2v-fast" as const;
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png"]);

export type VideoResolution = "480p" | "720p";

export interface VideoOptions {
  inputDir: string;
  outputDir: string;
  resolution: VideoResolution;
  numFrames: number;
  fps: number;
  sampleShift: number;
  goFast: boolean;
  force: boolean;
}

export async function runVideo(opts: VideoOptions): Promise<void> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is not set. Get one at https://replicate.com/account");

  const replicate = new Replicate({ auth: token });

  const imageFiles = fs
    .readdirSync(opts.inputDir)
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => path.join(opts.inputDir, f));

  if (!imageFiles.length) {
    console.log(`No image files (.jpg, .png) found in ${opts.inputDir}`);
    process.exit(1);
  }

  fs.mkdirSync(opts.outputDir, { recursive: true });

  console.log(`Input:  ${opts.inputDir}  (${imageFiles.length} images)`);
  console.log(`Output: ${opts.outputDir}`);
  console.log(`Model:  ${MODEL}  ${opts.resolution} ${opts.numFrames}f @${opts.fps}fps`);
  console.log();

  for (const imageFile of imageFiles) {
    const stem = path.basename(imageFile, path.extname(imageFile));
    const outPath = path.join(opts.outputDir, `${stem}.mp4`);

    if (fs.existsSync(outPath) && !opts.force) {
      console.log(`[skip]  ${stem}.mp4`);
      continue;
    }

    const promptFile = path.join(opts.inputDir, `${stem}.txt`);
    let prompt = "Subtle natural motion, gentle camera movement";
    if (fs.existsSync(promptFile)) {
      const text = fs.readFileSync(promptFile, "utf-8").trim();
      if (text) prompt = text;
    } else {
      console.log(`[warn]  No prompt file ${stem}.txt — using default prompt`);
    }

    process.stdout.write(`[gen]   ${path.basename(imageFile)} → ${stem}.mp4 ... `);
    try {
      const imageData = fs.readFileSync(imageFile);
      const mimeType = imageFile.endsWith(".png") ? "image/png" : "image/jpeg";
      const dataUri = `data:${mimeType};base64,${imageData.toString("base64")}`;

      const output = await replicate.run(MODEL, {
        input: {
          image: dataUri,
          prompt,
          resolution: opts.resolution,
          num_frames: opts.numFrames,
          frames_per_second: opts.fps,
          sample_shift: opts.sampleShift,
          go_fast: opts.goFast,
        },
      }) as unknown as string;

      const uri = typeof output === "string" ? output : String(output);
      if (!uri) throw new Error("No output URI returned from model");

      const res = await fetch(uri);
      if (!res.ok) throw new Error(`Failed to download video: ${res.status} ${res.statusText}`);

      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outPath, buffer);

      const sizeMb = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(1);
      console.log(`done (${sizeMb} MB)`);
    } catch (e) {
      console.log(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

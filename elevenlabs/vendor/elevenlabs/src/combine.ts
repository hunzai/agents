import * as fs from "fs";
import * as path from "path";

export function runCombine(opts: {
  transcribeDir: string;
  outputFile: string;
  force: boolean;
}): void {
  if (fs.existsSync(opts.outputFile) && !opts.force) {
    console.log(`[skip]  ${opts.outputFile}  (already exists, use --force to overwrite)`);
    return;
  }

  const txtFiles = fs
    .readdirSync(opts.transcribeDir)
    .filter(
      (f) =>
        path.extname(f).toLowerCase() === ".txt" &&
        !f.includes("-image-prompt"), // exclude any image-prompt files
    )
    .sort()
    .map((f) => path.join(opts.transcribeDir, f));

  if (!txtFiles.length) {
    console.error(`No .txt files found in ${opts.transcribeDir}`);
    process.exit(1);
  }

  const parts = txtFiles.map((f) => fs.readFileSync(f, "utf-8").trim()).filter(Boolean);

  const outputDir = path.dirname(opts.outputFile);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(opts.outputFile, parts.join("\n\n"), "utf-8");

  console.log(`[done]  Combined ${txtFiles.length} files → ${opts.outputFile}`);
}

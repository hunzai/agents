#!/usr/bin/env node
// ElevenLabs TTS — reads ELEVENLABS_API_KEY from env, saves audio to /tmp/voice-speech.mp3

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";

const text = process.argv.slice(2).join(" ").trim();

if (!text) {
  console.error("Usage: node speak.mjs <text to speak>");
  process.exit(1);
}

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("Error: ELEVENLABS_API_KEY is not set in environment");
  process.exit(1);
}

const client = new ElevenLabsClient({ apiKey });

// Convert text to audio stream using George voice (eleven_flash_v2_5 = ~75ms latency)
const audio = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
  text,
  modelId: "eleven_flash_v2_5",
});

const outPath = "/tmp/voice-speech.mp3";
await pipeline(audio, createWriteStream(outPath));
console.log(`Saved: ${outPath}`);

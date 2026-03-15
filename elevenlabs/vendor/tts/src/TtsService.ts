import { ElevenLabsClient, play } from "@elevenlabs/elevenlabs-js";
import { writeFile } from "fs/promises";
import { Readable } from "stream";
import type { SpeakOptions, SpeakResult, VoiceInfo, ModelInfo, TtsModel } from "./types.js";

export const DEFAULT_VOICE = "JBFqnCBsd6RMkjVDRZzb"; // George
export const DEFAULT_MODEL: TtsModel = "eleven_flash_v2_5";
export const DEFAULT_OUTPUT = "/tmp/voice-speech.mp3";

export const VOICES: VoiceInfo[] = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George",    gender: "male",   description: "Narrative, deep — default" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian",     gender: "male",   description: "Deep, authoritative" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris",     gender: "male",   description: "Casual, conversational" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam",      gender: "male",   description: "Young, energetic" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah",     gender: "female", description: "Soft, pleasant" },
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", gender: "female", description: "Conversational, warm" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica",   gender: "female", description: "Expressive, dynamic" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily",      gender: "female", description: "Calm, soothing" },
];

export const MODELS: ModelInfo[] = [
  { id: "eleven_flash_v2_5",      name: "Flash v2.5",      description: "Lowest latency (~75ms)",     languages: "32 languages" },
  { id: "eleven_turbo_v2_5",      name: "Turbo v2.5",      description: "Balanced speed and quality", languages: "32 languages" },
  { id: "eleven_multilingual_v2", name: "Multilingual v2", description: "Highest quality",            languages: "29 languages" },
  { id: "eleven_monolingual_v1",  name: "Monolingual v1",  description: "English only, legacy",       languages: "English" },
];

/**
 * TtsService — wraps ElevenLabs text-to-speech API.
 *
 * Uses client.textToSpeech.convert() which returns a Web ReadableStream<Uint8Array>.
 * The stream is drained into a Buffer, saved to disk, then played via mpv/ffplay.
 *
 * API reference: https://elevenlabs.io/docs/eleven-api/guides/cookbooks/text-to-speech/quickstart
 */
export class TtsService {
  private client: ElevenLabsClient;

  constructor(apiKey: string) {
    this.client = new ElevenLabsClient({ apiKey });
  }

  async speak(text: string, options: SpeakOptions = {}): Promise<SpeakResult> {
    const voice = options.voice ?? DEFAULT_VOICE;
    const model = options.model ?? DEFAULT_MODEL;
    const outPath = options.output ?? DEFAULT_OUTPUT;
    const shouldPlay = options.play !== false;

    console.error(`[tts] Generating — voice=${voice} model=${model}`);

    // Returns a Web ReadableStream<Uint8Array> per the ElevenLabs JS SDK
    const audio = await this.client.textToSpeech.convert(voice, {
      text,
      modelId: model,
      outputFormat: "mp3_44100_128",
    });

    // Drain the Web ReadableStream into a Buffer
    const chunks: Uint8Array[] = [];
    const reader = audio.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const buffer = Buffer.concat(chunks);

    await writeFile(outPath, buffer);
    console.error(`[tts] Saved: ${outPath}`);

    if (shouldPlay) {
      // SDK play() requires a Node Readable — wrap buffer as single-chunk stream
      await play(Readable.from([buffer]));
    }

    return { path: outPath, voice, model, text };
  }

  listVoices(): VoiceInfo[] {
    return VOICES;
  }

  listModels(): ModelInfo[] {
    return MODELS;
  }
}

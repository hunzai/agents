export interface SpeakOptions {
  voice?: string;
  model?: string;
  output?: string;
  play?: boolean;
}

export interface SpeakResult {
  path: string;
  voice: string;
  model: string;
  text: string;
}

export interface VoiceInfo {
  id: string;
  name: string;
  gender: string;
  description: string;
}

export type TtsModel =
  | "eleven_flash_v2_5"   // ~75ms latency, best for real-time
  | "eleven_turbo_v2_5"   // balanced speed/quality
  | "eleven_multilingual_v2" // highest quality, 29 languages
  | "eleven_monolingual_v1"; // English-only, legacy

export interface ModelInfo {
  id: TtsModel;
  name: string;
  description: string;
  languages: string;
}

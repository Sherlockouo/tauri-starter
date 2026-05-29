/**
 * Fish Speech TTS API Client
 *
 * All TTS service calls are routed through the Rust backend via Tauri IPC.
 * This avoids webview fetch issues (CORS, mixed-content, proxy timeouts)
 * that caused 500 errors when calling the external server directly from the browser.
 */

import { invoke } from "@tauri-apps/api/core";

export const TTS_BASE_URL = "http://192.168.1.246:8080";

export interface TTSParams {
  format: "wav" | "mp3" | "pcm" | "opus";
  latency: "normal" | "balanced";
  seed?: number;
  normalize: boolean;
  streaming: boolean;
  chunk_length: number;
  max_new_tokens?: number;
  use_memory_cache: "on" | "off";
}

export const DEFAULT_TTS_PARAMS: TTSParams = {
  format: "mp3",
  latency: "normal",
  normalize: true,
  streaming: false,
  chunk_length: 200,
  use_memory_cache: "on",
};

/**
 * List all available voice references from the TTS server (via Rust proxy)
 */
export async function listReferences(): Promise<string[]> {
  return invoke<string[]>("list_tts_references");
}

/**
 * Add a new voice reference to the TTS server (via Rust proxy)
 * Reads the audio file, converts to base64, and sends through IPC.
 */
export async function addReference(id: string, audioFile: File, text: string): Promise<void> {
  const arrayBuffer = await audioFile.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const audioB64 = arrayBufferToBase64(bytes);

  await invoke<void>("add_tts_reference", {
    id,
    audioB64,
    audioFilename: audioFile.name,
    text,
  });
}

/**
 * Delete a voice reference from the TTS server (via Rust proxy)
 */
export async function deleteReference(referenceId: string): Promise<void> {
  await invoke<void>("delete_tts_reference", { referenceId });
}

/**
 * Rename a voice reference on the TTS server (via Rust proxy)
 */
export async function renameReference(oldId: string, newId: string): Promise<void> {
  await invoke<void>("rename_tts_reference", { oldId, newId });
}

/**
 * Generate TTS audio via Rust backend proxy — returns raw audio bytes as ArrayBuffer.
 * The Rust backend calls the Fish Speech server and returns base64-encoded audio.
 */
export async function generateTTS(
  text: string,
  referenceId: string | null,
  params: TTSParams,
): Promise<ArrayBuffer> {
  const input: Record<string, unknown> = {
    text,
    format: params.format,
    latency: params.latency,
    normalize: params.normalize,
    streaming: false,
    chunk_length: params.chunk_length,
    use_memory_cache: params.use_memory_cache,
    reference_id: referenceId || null,
    seed: params.seed ?? null,
    max_new_tokens: params.max_new_tokens ?? null,
  };

  // Rust command returns base64-encoded audio
  const b64Audio = await invoke<string>("generate_tts", { input });

  // Decode base64 to ArrayBuffer
  const binaryStr = atob(b64Audio);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes.buffer;
}

// ===== Utility =====

function arrayBufferToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

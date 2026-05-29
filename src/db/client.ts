import { invoke } from "@tauri-apps/api/core";
import type { Voice } from "../store/voices";
import type { HistoryEntry } from "../store/history";

/**
 * §11: IPC Layer — Tauri command wrappers for TTS Workshop
 *
 * Rules:
 * - Batch: Never N sequential IPC calls.
 * - Push, don't poll: Rust pushes deltas via events.
 * - Serialize minimally: Only changed fields.
 * - Never block main: All handlers async.
 */

export const dbClient = {
  /**
   * §1: Initialize database — runs migrations on first launch.
   */
  async initialize(): Promise<void> {
    await invoke<void>("db_initialize");
  },

  // ===== Voice operations =====

  async listVoices(): Promise<Voice[]> {
    return invoke<Voice[]>("list_voices");
  },

  async upsertVoice(id: string, description: string): Promise<Voice> {
    return invoke<Voice>("upsert_voice", { input: { id, description } });
  },

  async deleteVoice(voiceId: string): Promise<void> {
    await invoke<void>("delete_voice", { voiceId });
  },

  async renameVoice(oldId: string, newId: string): Promise<void> {
    await invoke<void>("rename_voice", { oldId, newId });
  },

  // ===== History operations =====

  async listHistory(): Promise<HistoryEntry[]> {
    return invoke<HistoryEntry[]>("list_history");
  },

  async addHistory(entry: {
    id: string;
    text: string;
    params: string;
    audio_path: string | null;
    voice_id: string | null;
    status: string;
    error: string | null;
  }): Promise<HistoryEntry> {
    return invoke<HistoryEntry>("add_history", { input: entry });
  },

  async deleteHistory(historyId: string): Promise<void> {
    await invoke<void>("delete_history", { historyId });
  },

  async updateHistory(
    historyId: string,
    status: string,
    audioPath: string | null,
    error: string | null,
  ): Promise<void> {
    await invoke<void>("update_history", { historyId, status, audioPath, error });
  },

  // ===== Audio file operations =====

  async saveAudioFile(dataB64: string, ext: string): Promise<string> {
    return invoke<string>("save_audio_file", { dataB64, ext });
  },

  async getAudioDirPath(): Promise<string> {
    return invoke<string>("get_audio_dir_path");
  },

  async copyAudioToDir(sourcePath: string, targetDir: string, filename: string): Promise<string> {
    return invoke<string>("copy_audio_to_dir", { sourcePath, targetDir, filename });
  },
};

import { Component, createSignal, Show, For } from "solid-js";
import { Tabs } from "@kobalte/core/tabs";
import { voiceStore } from "../store/voices";
import { historyStore } from "../store/history";
import { appState, appActions } from "../store";
import { dbClient } from "../db/client";
import { generateTTS, type TTSParams } from "../lib/api";
import { convertFileSrc } from "@tauri-apps/api/core";
import { HiOutlinePlay, HiOutlineBolt, HiOutlineSparkles, HiOutlineCog6Tooth } from "solid-icons/hi";
import { cn } from "../lib/cn";

/**
 * TTS Panel — Main content area with Single/Batch tab switch
 */
export const TTSPanel: Component = () => {
  return (
    <div class="flex flex-col flex-1 overflow-hidden">
      <Tabs
        value={appState.activeTab}
        onChange={(value) => appActions.setActiveTab(value as "single" | "batch")}
        class="flex flex-col flex-1 overflow-hidden"
      >
        {/* Tab header */}
        <div class="flex items-center px-6 pt-5 pb-0">
          <Tabs.List class="flex items-center gap-1 rounded-lg bg-surface-secondary p-1">
            <Tabs.Trigger
              value="single"
              class={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150",
                "text-content-secondary hover:text-content-primary",
                "ui-selected:bg-surface-primary ui-selected:text-content-primary ui-selected:shadow-subtle"
              )}
            >
              <HiOutlineSparkles class="w-4 h-4" />
              Single
            </Tabs.Trigger>
            <Tabs.Trigger
              value="batch"
              class={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150",
                "text-content-secondary hover:text-content-primary",
                "ui-selected:bg-surface-primary ui-selected:text-content-primary ui-selected:shadow-subtle"
              )}
            >
              <HiOutlineBolt class="w-4 h-4" />
              Batch
            </Tabs.Trigger>
          </Tabs.List>
        </div>

        {/* Tab content */}
        <Tabs.Content value="single" class="flex-1 overflow-y-auto px-6 py-4">
          <SingleMode />
        </Tabs.Content>
        <Tabs.Content value="batch" class="flex-1 overflow-y-auto px-6 py-4">
          <BatchMode />
        </Tabs.Content>
      </Tabs>
    </div>
  );
};

// ===== Single Mode =====

const SingleMode: Component = () => {
  const [text, setText] = createSignal("");
  const [format, setFormat] = createSignal<TTSParams["format"]>("mp3");
  const [latency, setLatency] = createSignal<TTSParams["latency"]>("normal");
  const [seed, setSeed] = createSignal<string>("");
  const [normalize, setNormalize] = createSignal(true);
  const [chunkLength, setChunkLength] = createSignal(200);
  const [generating, setGenerating] = createSignal(false);
  const [audioUrl, setAudioUrl] = createSignal<string | null>(null);

  const getParams = (): TTSParams => ({
    format: format(),
    latency: latency(),
    seed: seed() ? parseInt(seed()) : undefined,
    normalize: normalize(),
    streaming: false,
    chunk_length: chunkLength(),
    use_memory_cache: "on",
  });

  const handleGenerate = async (): Promise<void> => {
    const inputText = text().trim();
    if (!inputText) {
      appActions.showToast("Please enter text to synthesize");
      return;
    }

    setGenerating(true);
    const params = getParams();
    const voiceId = voiceStore.selectedId;
    const historyId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // §2: Optimistic — add history entry immediately as pending
    const entry = {
      id: historyId,
      text: inputText,
      params: JSON.stringify(params),
      audio_path: null,
      voice_id: voiceId,
      created_at: new Date().toISOString(),
      status: "pending" as const,
      error: null,
    };
    historyStore.add(entry);
    await dbClient.addHistory(entry);

    try {
      const audioBuffer = await generateTTS(inputText, voiceId, params);

      // Convert to base64 and save via Rust
      const bytes = new Uint8Array(audioBuffer);
      const b64 = arrayBufferToBase64(bytes);
      const filePath = await dbClient.saveAudioFile(b64, params.format);

      // Update history with success
      historyStore.updateStatus(historyId, "done", filePath, null);
      await dbClient.updateHistory(historyId, "done", filePath, null);

      // Set audio URL for playback
      const assetUrl = convertFileSrc(filePath);
      setAudioUrl(assetUrl);

      appActions.showToast("TTS generated successfully");
    } catch (e) {
      const errMsg = (e as Error).message;
      historyStore.updateStatus(historyId, "failed", null, errMsg);
      await dbClient.updateHistory(historyId, "failed", null, errMsg);
      appActions.showToast(`Generation failed: ${errMsg}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div class="space-y-5 max-w-2xl">
      {/* Text input */}
      <div class="space-y-2">
        <label class="text-xs font-medium text-content-secondary uppercase tracking-wide">
          Text to synthesize
        </label>
        <textarea
          class="input-field min-h-[140px] resize-y font-sans leading-relaxed"
          placeholder="Enter text to synthesize..."
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
          rows={6}
        />
        <div class="flex justify-end">
          <span class="text-2xs text-content-tertiary">
            {text().length} characters
          </span>
        </div>
      </div>

      {/* Parameters */}
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <HiOutlineCog6Tooth class="w-4 h-4 text-content-tertiary" />
          <span class="text-xs font-medium text-content-secondary uppercase tracking-wide">
            Parameters
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          {/* Voice */}
          <div class="space-y-1.5">
            <label class="text-xs text-content-secondary">Voice</label>
            <select
              class="select-field text-xs"
              value={voiceStore.selectedId || ""}
              onChange={(e) => voiceStore.select(e.currentTarget.value || null)}
            >
              <option value="">No voice (default)</option>
              <For each={voiceStore.all}>
                {(voice) => <option value={voice.id}>{voice.id}</option>}
              </For>
            </select>
          </div>

          {/* Format */}
          <div class="space-y-1.5">
            <label class="text-xs text-content-secondary">Format</label>
            <select
              class="select-field text-xs"
              value={format()}
              onChange={(e) => setFormat(e.currentTarget.value as TTSParams["format"])}
            >
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="opus">Opus</option>
              <option value="pcm">PCM</option>
            </select>
          </div>

          {/* Latency */}
          <div class="space-y-1.5">
            <label class="text-xs text-content-secondary">Latency</label>
            <select
              class="select-field text-xs"
              value={latency()}
              onChange={(e) => setLatency(e.currentTarget.value as TTSParams["latency"])}
            >
              <option value="normal">Normal</option>
              <option value="balanced">Balanced</option>
            </select>
          </div>

          {/* Seed */}
          <div class="space-y-1.5">
            <label class="text-xs text-content-secondary">Seed</label>
            <input
              class="input-field text-xs"
              type="number"
              placeholder="Random"
              value={seed()}
              onInput={(e) => setSeed(e.currentTarget.value)}
            />
          </div>

          {/* Chunk Length */}
          <div class="space-y-1.5">
            <label class="text-xs text-content-secondary">Chunk Length</label>
            <input
              class="input-field text-xs"
              type="number"
              min={50}
              max={500}
              value={chunkLength()}
              onInput={(e) => setChunkLength(parseInt(e.currentTarget.value) || 200)}
            />
          </div>

          {/* Normalize */}
          <div class="space-y-1.5">
            <label class="text-xs text-content-secondary">Normalize</label>
            <div class="flex items-center h-[38px]">
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={normalize()}
                  onChange={(e) => setNormalize(e.currentTarget.checked)}
                  class="sr-only peer"
                />
                <div class="w-9 h-5 bg-content-tertiary/30 peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Generate button */}
      <div class="pt-2">
        <button
          class={cn(
            "btn-primary w-full py-3 text-sm font-semibold",
            generating() && "animate-pulse"
          )}
          onClick={handleGenerate}
          disabled={generating() || !text().trim()}
        >
          {generating() ? (
            <>
              <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <HiOutlinePlay class="w-4 h-4" />
              Generate Speech
            </>
          )}
        </button>
      </div>

      {/* Audio player */}
      <Show when={audioUrl()}>
        <div class="rounded-xl border border-border bg-surface-secondary p-4 animate-slide-up">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <HiOutlinePlay class="w-4 h-4 text-accent" />
            </div>
            <span class="text-sm font-medium text-content-primary">Generated Audio</span>
          </div>
          <audio
            controls
            src={audioUrl()!}
            class="w-full h-10 rounded-lg"
          />
        </div>
      </Show>
    </div>
  );
};

// ===== Batch Mode =====

const BatchMode: Component = () => {
  const [batchText, setBatchText] = createSignal("");
  const [format, setFormat] = createSignal<TTSParams["format"]>("mp3");
  const [latency, setLatency] = createSignal<TTSParams["latency"]>("normal");
  const [normalize, setNormalize] = createSignal(true);
  const [chunkLength, setChunkLength] = createSignal(200);
  const [processing, setProcessing] = createSignal(false);
  const [progress, setProgress] = createSignal("");

  const handleBatch = async (): Promise<void> => {
    const lines = batchText()
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      appActions.showToast("Enter at least one line of text");
      return;
    }

    setProcessing(true);
    const voiceId = voiceStore.selectedId;
    const params: TTSParams = {
      format: format(),
      latency: latency(),
      normalize: normalize(),
      streaming: false,
      chunk_length: chunkLength(),
      use_memory_cache: "on",
    };

    const generatedPaths: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      setProgress(`Processing ${i + 1} / ${lines.length}...`);
      const historyId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const entry = {
        id: historyId,
        text: line,
        params: JSON.stringify(params),
        audio_path: null,
        voice_id: voiceId,
        created_at: new Date().toISOString(),
        status: "pending" as const,
        error: null,
      };
      historyStore.add(entry);
      await dbClient.addHistory(entry);

      try {
        const audioBuffer = await generateTTS(line, voiceId, params);
        const bytes = new Uint8Array(audioBuffer);
        const b64 = arrayBufferToBase64(bytes);
        const filePath = await dbClient.saveAudioFile(b64, params.format);

        historyStore.updateStatus(historyId, "done", filePath, null);
        await dbClient.updateHistory(historyId, "done", filePath, null);
        generatedPaths.push(filePath);
      } catch (e) {
        const errMsg = (e as Error).message;
        historyStore.updateStatus(historyId, "failed", null, errMsg);
        await dbClient.updateHistory(historyId, "failed", null, errMsg);
      }
    }

    setProcessing(false);
    setProgress("");

    if (generatedPaths.length > 0) {
      appActions.showToast(
        `Batch complete: ${generatedPaths.length}/${lines.length} succeeded. Use Export in History to save files.`
      );
    } else {
      appActions.showToast("Batch failed — all items errored");
    }
  };

  const lineCount = () => {
    const lines = batchText().split("\n").filter((l) => l.trim().length > 0);
    return lines.length;
  };

  return (
    <div class="space-y-5 max-w-2xl">
      {/* Batch text input */}
      <div class="space-y-2">
        <label class="text-xs font-medium text-content-secondary uppercase tracking-wide">
          Batch text (one per line)
        </label>
        <textarea
          class="input-field min-h-[200px] resize-y font-mono text-xs leading-relaxed"
          placeholder="Enter multiple lines of text (one per line)..."
          value={batchText()}
          onInput={(e) => setBatchText(e.currentTarget.value)}
          rows={10}
        />
        <div class="flex justify-end">
          <span class="text-2xs text-content-tertiary">
            {lineCount()} lines
          </span>
        </div>
      </div>

      {/* Parameters */}
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <HiOutlineCog6Tooth class="w-4 h-4 text-content-tertiary" />
          <span class="text-xs font-medium text-content-secondary uppercase tracking-wide">
            Parameters
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          {/* Voice */}
          <div class="space-y-1.5">
            <label class="text-xs text-content-secondary">Voice</label>
            <select
              class="select-field text-xs"
              value={voiceStore.selectedId || ""}
              onChange={(e) => voiceStore.select(e.currentTarget.value || null)}
            >
              <option value="">No voice (default)</option>
              <For each={voiceStore.all}>
                {(voice) => <option value={voice.id}>{voice.id}</option>}
              </For>
            </select>
          </div>

          {/* Format */}
          <div class="space-y-1.5">
            <label class="text-xs text-content-secondary">Format</label>
            <select
              class="select-field text-xs"
              value={format()}
              onChange={(e) => setFormat(e.currentTarget.value as TTSParams["format"])}
            >
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="opus">Opus</option>
              <option value="pcm">PCM</option>
            </select>
          </div>

          {/* Latency */}
          <div class="space-y-1.5">
            <label class="text-xs text-content-secondary">Latency</label>
            <select
              class="select-field text-xs"
              value={latency()}
              onChange={(e) => setLatency(e.currentTarget.value as TTSParams["latency"])}
            >
              <option value="normal">Normal</option>
              <option value="balanced">Balanced</option>
            </select>
          </div>

          {/* Chunk Length */}
          <div class="space-y-1.5">
            <label class="text-xs text-content-secondary">Chunk Length</label>
            <input
              class="input-field text-xs"
              type="number"
              min={50}
              max={500}
              value={chunkLength()}
              onInput={(e) => setChunkLength(parseInt(e.currentTarget.value) || 200)}
            />
          </div>

          {/* Normalize */}
          <div class="space-y-1.5">
            <label class="text-xs text-content-secondary">Normalize</label>
            <div class="flex items-center h-[38px]">
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={normalize()}
                  onChange={(e) => setNormalize(e.currentTarget.checked)}
                  class="sr-only peer"
                />
                <div class="w-9 h-5 bg-content-tertiary/30 peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Generate button */}
      <div class="pt-2">
        <button
          class={cn(
            "btn-primary w-full py-3 text-sm font-semibold",
            processing() && "animate-pulse"
          )}
          onClick={handleBatch}
          disabled={processing() || !batchText().trim()}
        >
          {processing() ? (
            <>
              <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {progress()}
            </>
          ) : (
            <>
              <HiOutlineBolt class="w-4 h-4" />
              Batch Generate ({lineCount()} items)
            </>
          )}
        </button>
      </div>

      {/* Progress indicator */}
      <Show when={processing() && progress()}>
        <div class="rounded-lg border border-accent/20 bg-accent/5 p-3 animate-fade-in">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span class="text-sm text-accent font-medium">{progress()}</span>
          </div>
        </div>
      </Show>
    </div>
  );
};

// ===== Utility =====

function arrayBufferToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

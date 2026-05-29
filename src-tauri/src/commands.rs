//! §11: IPC Commands — TTS Workshop
//!
//! Commands for voice management, history CRUD, and audio file storage.
//! TTS API calls are handled by the frontend (external service, not synced DB).
//! These commands manage the local SQLite cache and audio file persistence.

use crate::db;
use base64::Engine;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use tauri::AppHandle;
use uuid::Uuid;
use std::sync::OnceLock;

/// Shared reqwest client — reuses connections
static HTTP_CLIENT: OnceLock<reqwest::Client> = OnceLock::new();

fn http_client() -> &'static reqwest::Client {
    HTTP_CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(120))
            .build()
            .expect("Failed to build HTTP client")
    })
}

/// Voice model — local cache of server voice + description
#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Voice {
    pub id: String,
    pub description: String,
    pub created_at: String,
}

/// History entry model
#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct HistoryEntry {
    pub id: String,
    pub text: String,
    pub params: String,
    pub audio_path: Option<String>,
    pub voice_id: Option<String>,
    pub created_at: String,
    pub status: String,
    pub error: Option<String>,
}

/// Input for creating/upserting a voice
#[derive(Debug, Deserialize)]
pub struct UpsertVoiceInput {
    pub id: String,
    pub description: String,
}

/// Input for adding a history entry
#[derive(Debug, Deserialize)]
pub struct AddHistoryInput {
    pub id: String,
    pub text: String,
    pub params: String,
    pub audio_path: Option<String>,
    pub voice_id: Option<String>,
    pub status: String,
    pub error: Option<String>,
}

/// §1: Initialize DB — called from frontend bootstrap Phase 2.
#[tauri::command]
pub async fn db_initialize() -> Result<(), String> {
    Ok(())
}

// ===== Voice Commands =====

/// List all voices from local DB cache
#[tauri::command]
pub async fn list_voices() -> Result<Vec<Voice>, String> {
    let pool = db::pool();
    let rows = sqlx::query_as::<_, Voice>(
        "SELECT id, description, created_at FROM voices ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

/// Upsert a voice (insert or update description)
#[tauri::command]
pub async fn upsert_voice(input: UpsertVoiceInput) -> Result<Voice, String> {
    let pool = db::pool();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"INSERT INTO voices (id, description, created_at) VALUES (?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET description = excluded.description"#,
    )
    .bind(&input.id)
    .bind(&input.description)
    .bind(&now)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(Voice {
        id: input.id,
        description: input.description,
        created_at: now,
    })
}

/// Delete a voice from local cache
#[tauri::command]
pub async fn delete_voice(voice_id: String) -> Result<(), String> {
    let pool = db::pool();

    sqlx::query("DELETE FROM voices WHERE id = ?")
        .bind(&voice_id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Rename a voice in local cache
#[tauri::command]
pub async fn rename_voice(old_id: String, new_id: String) -> Result<(), String> {
    let pool = db::pool();

    sqlx::query("UPDATE voices SET id = ? WHERE id = ?")
        .bind(&new_id)
        .bind(&old_id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ===== History Commands =====

/// List all history entries
#[tauri::command]
pub async fn list_history() -> Result<Vec<HistoryEntry>, String> {
    let pool = db::pool();
    let rows = sqlx::query_as::<_, HistoryEntry>(
        r#"SELECT id, text, params, audio_path, voice_id, created_at, status, error
           FROM history
           ORDER BY created_at DESC
           LIMIT 500"#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

/// Add a history entry
#[tauri::command]
pub async fn add_history(input: AddHistoryInput) -> Result<HistoryEntry, String> {
    let pool = db::pool();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"INSERT INTO history (id, text, params, audio_path, voice_id, created_at, status, error)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)"#,
    )
    .bind(&input.id)
    .bind(&input.text)
    .bind(&input.params)
    .bind(&input.audio_path)
    .bind(&input.voice_id)
    .bind(&now)
    .bind(&input.status)
    .bind(&input.error)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(HistoryEntry {
        id: input.id,
        text: input.text,
        params: input.params,
        audio_path: input.audio_path,
        voice_id: input.voice_id,
        created_at: now,
        status: input.status,
        error: input.error,
    })
}

/// Delete a history entry
#[tauri::command]
pub async fn delete_history(history_id: String) -> Result<(), String> {
    let pool = db::pool();

    sqlx::query("DELETE FROM history WHERE id = ?")
        .bind(&history_id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Update history entry status and audio path (after TTS completes)
#[tauri::command]
pub async fn update_history(
    history_id: String,
    status: String,
    audio_path: Option<String>,
    error: Option<String>,
) -> Result<(), String> {
    let pool = db::pool();

    sqlx::query(
        "UPDATE history SET status = ?, audio_path = ?, error = ? WHERE id = ?",
    )
    .bind(&status)
    .bind(&audio_path)
    .bind(&error)
    .bind(&history_id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

// ===== Audio File Commands =====

/// Save audio bytes to app data directory. Accepts base64-encoded audio data.
/// Returns the absolute file path of the saved file.
#[tauri::command]
pub async fn save_audio_file(
    app: AppHandle,
    data_b64: String,
    ext: String,
) -> Result<String, String> {
    let audio_dir = db::get_audio_dir(&app).map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&audio_dir).map_err(|e| e.to_string())?;

    let filename = format!("{}.{}", Uuid::new_v4(), ext);
    let file_path = audio_dir.join(&filename);

    let bytes = base64::engine::general_purpose::STANDARD
        .decode(&data_b64)
        .map_err(|e| format!("Base64 decode error: {e}"))?;

    std::fs::write(&file_path, &bytes).map_err(|e| format!("File write error: {e}"))?;

    Ok(file_path.to_string_lossy().to_string())
}

/// Get the audio directory path (for export/copy operations)
#[tauri::command]
pub async fn get_audio_dir_path(app: AppHandle) -> Result<String, String> {
    let audio_dir = db::get_audio_dir(&app).map_err(|e| e.to_string())?;
    Ok(audio_dir.to_string_lossy().to_string())
}

/// Copy an audio file to a target directory (for batch export)
#[tauri::command]
pub async fn copy_audio_to_dir(
    source_path: String,
    target_dir: String,
    filename: String,
) -> Result<String, String> {
    let target = std::path::PathBuf::from(&target_dir).join(&filename);
    std::fs::copy(&source_path, &target)
        .map_err(|e| format!("Copy failed: {e}"))?;
    Ok(target.to_string_lossy().to_string())
}

// ===== TTS API Proxy Commands =====
// Route external TTS API calls through Rust to avoid webview fetch issues
// (CORS, mixed-content, CSP, proxy timeouts)

const TTS_BASE_URL: &str = "http://192.168.1.246:8080";

/// Input for TTS generation request
#[derive(Debug, Deserialize)]
pub struct GenerateTTSInput {
    pub text: String,
    pub reference_id: Option<String>,
    pub format: String,
    pub latency: String,
    pub normalize: bool,
    pub streaming: bool,
    pub chunk_length: u32,
    pub use_memory_cache: String,
    pub seed: Option<i64>,
    pub max_new_tokens: Option<u32>,
}

/// Generate TTS audio via the Fish Speech server — returns base64-encoded audio
#[tauri::command]
pub async fn generate_tts(input: GenerateTTSInput) -> Result<String, String> {
    let client = http_client();

    let mut body = serde_json::json!({
        "text": input.text,
        "format": input.format,
        "latency": input.latency,
        "normalize": input.normalize,
        "streaming": input.streaming,
        "chunk_length": input.chunk_length,
        "use_memory_cache": input.use_memory_cache,
    });

    if let Some(ref reference_id) = input.reference_id {
        body["reference_id"] = serde_json::json!(reference_id);
    }
    if let Some(seed) = input.seed {
        body["seed"] = serde_json::json!(seed);
    }
    if let Some(max_new_tokens) = input.max_new_tokens {
        body["max_new_tokens"] = serde_json::json!(max_new_tokens);
    }

    let resp = client
        .post(format!("{TTS_BASE_URL}/v1/tts"))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("TTS request failed: {e}"))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let err_text = resp.text().await.unwrap_or_default();
        return Err(format!("TTS server error {status}: {err_text}"));
    }

    let audio_bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("Failed to read TTS response: {e}"))?;

    // Return as base64 — frontend will decode and save
    let b64 = base64::engine::general_purpose::STANDARD.encode(&audio_bytes);
    Ok(b64)
}

/// List available voice references from the TTS server
#[tauri::command]
pub async fn list_tts_references() -> Result<Vec<String>, String> {
    let client = http_client();

    let resp = client
        .get(format!("{TTS_BASE_URL}/v1/references/list"))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("List references failed: {e}"))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let err_text = resp.text().await.unwrap_or_default();
        return Err(format!("List references error {status}: {err_text}"));
    }

    #[derive(Deserialize)]
    struct ReferenceListResponse {
        success: bool,
        reference_ids: Vec<String>,
        message: String,
    }

    let data: ReferenceListResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse references response: {e}"))?;

    if !data.success {
        return Err(format!("Server error: {}", data.message));
    }

    Ok(data.reference_ids)
}

/// Add a voice reference to the TTS server (multipart upload)
#[tauri::command]
pub async fn add_tts_reference(
    id: String,
    audio_b64: String,
    audio_filename: String,
    text: String,
) -> Result<(), String> {
    let client = http_client();

    let audio_bytes = base64::engine::general_purpose::STANDARD
        .decode(&audio_b64)
        .map_err(|e| format!("Base64 decode error: {e}"))?;

    let audio_part = reqwest::multipart::Part::bytes(audio_bytes)
        .file_name(audio_filename)
        .mime_str("audio/wav")
        .map_err(|e| format!("MIME error: {e}"))?;

    let form = reqwest::multipart::Form::new()
        .text("id", id)
        .text("text", text)
        .part("audio", audio_part);

    let resp = client
        .post(format!("{TTS_BASE_URL}/v1/references/add"))
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("Add reference failed: {e}"))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let err_text = resp.text().await.unwrap_or_default();
        return Err(format!("Add reference error {status}: {err_text}"));
    }

    Ok(())
}

/// Delete a voice reference from the TTS server
#[tauri::command]
pub async fn delete_tts_reference(reference_id: String) -> Result<(), String> {
    let client = http_client();

    let resp = client
        .delete(format!("{TTS_BASE_URL}/v1/references/delete"))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({ "reference_id": reference_id }))
        .send()
        .await
        .map_err(|e| format!("Delete reference failed: {e}"))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let err_text = resp.text().await.unwrap_or_default();
        return Err(format!("Delete reference error {status}: {err_text}"));
    }

    Ok(())
}

/// Rename a voice reference on the TTS server
#[tauri::command]
pub async fn rename_tts_reference(old_id: String, new_id: String) -> Result<(), String> {
    let client = http_client();

    let resp = client
        .post(format!("{TTS_BASE_URL}/v1/references/update"))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "old_reference_id": old_id,
            "new_reference_id": new_id,
        }))
        .send()
        .await
        .map_err(|e| format!("Rename reference failed: {e}"))?;

    if !resp.status().is_success() {
        let status = resp.status().as_u16();
        let err_text = resp.text().await.unwrap_or_default();
        return Err(format!("Rename reference error {status}: {err_text}"));
    }

    Ok(())
}

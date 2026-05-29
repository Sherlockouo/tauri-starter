//! §1: Local-First Data — SQLite via sqlx
//!
//! Database initialization and migrations for TTS Workshop.
//! Stores voice metadata (local cache + descriptions) and TTS generation history.
//! Audio files stored on filesystem; DB holds paths.

use sqlx::sqlite::{SqliteConnectOptions, SqlitePool, SqlitePoolOptions};
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::OnceLock;
use tauri::{AppHandle, Manager};

/// Global database pool — initialized once during app setup
static DB_POOL: OnceLock<SqlitePool> = OnceLock::new();

/// Get the database pool (panics if not initialized)
pub fn pool() -> &'static SqlitePool {
    DB_POOL.get().expect("Database not initialized")
}

/// §1: Initialize database — runs migrations on first launch.
/// Called during Tauri setup phase, before window renders.
pub async fn initialize(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let db_path = get_db_path(app)?;

    // Ensure parent directory exists
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    // Also ensure audio directory exists
    let audio_dir = get_audio_dir(app)?;
    std::fs::create_dir_all(&audio_dir)?;

    // Connect with WAL mode for concurrent reads during writes
    let options = SqliteConnectOptions::from_str(&format!("sqlite:{}", db_path.display()))?
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .busy_timeout(std::time::Duration::from_secs(5));

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;

    // Run migrations
    run_migrations(&pool).await?;

    DB_POOL.set(pool).map_err(|_| "Database already initialized")?;
    Ok(())
}

/// Get platform-appropriate database path
fn get_db_path(app: &AppHandle) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;
    Ok(app_data.join("tts-workshop.db"))
}

/// Get audio storage directory
pub fn get_audio_dir(app: &AppHandle) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;
    Ok(app_data.join("audio"))
}

/// Schema migrations — TTS Workshop tables
async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    // Voices table — local cache of server voice IDs + user-added descriptions
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS voices (
            id TEXT PRIMARY KEY NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        "#,
    )
    .execute(pool)
    .await?;

    // History table — every TTS generation attempt
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS history (
            id TEXT PRIMARY KEY NOT NULL,
            text TEXT NOT NULL,
            params TEXT NOT NULL DEFAULT '{}',
            audio_path TEXT,
            voice_id TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            status TEXT NOT NULL DEFAULT 'pending',
            error TEXT
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Index for history queries
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at DESC)",
    )
    .execute(pool)
    .await?;

    Ok(())
}

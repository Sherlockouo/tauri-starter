//! Local-First Data — SQLite via sqlx.
//!
//! Database initialization and migrations for the dashboard template.
//! A single `metrics` table is seeded deterministically on first launch so the
//! dashboard renders with real data straight out of the box.

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

/// Initialize the database — runs migrations + seed on first launch.
/// Called during Tauri setup phase, before the window renders.
pub async fn initialize(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let db_path = get_db_path(app)?;

    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    // WAL mode for concurrent reads during writes
    let options = SqliteConnectOptions::from_str(&format!("sqlite:{}", db_path.display()))?
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .busy_timeout(std::time::Duration::from_secs(5));

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;

    run_migrations(&pool).await?;
    seed_if_empty(&pool).await?;

    DB_POOL
        .set(pool)
        .map_err(|_| "Database already initialized")?;
    Ok(())
}

fn get_db_path(app: &AppHandle) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;
    Ok(app_data.join("dashboard.db"))
}

async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS metrics (
            date TEXT PRIMARY KEY NOT NULL,
            revenue REAL NOT NULL,
            users INTEGER NOT NULL,
            orders INTEGER NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_metrics_date ON metrics(date DESC)")
        .execute(pool)
        .await?;

    Ok(())
}

/// Seed ~180 days of demo metrics on first launch (deterministic random walk).
async fn seed_if_empty(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM metrics")
        .fetch_one(pool)
        .await?;
    if count.0 > 0 {
        return Ok(());
    }

    let today = chrono::Utc::now().date_naive();

    for i in (0..=180).rev() {
        let date = today - chrono::Duration::days(i);
        // Gentle trend + weekly waves + centered noise (non-compounding)
        let pos = (180 - i) as f64 / 180.0;
        let wiggle = |wavelength: f64, n: i64| {
            1.0 + (i as f64 / wavelength).sin() * 0.04 + (pseudo_random(n) - 0.5) * 0.1
        };

        let revenue = 36000.0 * (1.0 + 0.25 * pos) * wiggle(3.6, i);
        let users = (10800.0 * (1.0 + 0.2 * pos) * wiggle(5.2, i + 1)).round() as i64;
        let orders = (620.0 * (1.0 + 0.3 * pos) * wiggle(4.1, i + 2)).round() as i64;

        sqlx::query("INSERT INTO metrics (date, revenue, users, orders) VALUES (?, ?, ?, ?)")
            .bind(date.format("%Y-%m-%d").to_string())
            .bind((revenue * 100.0).round() / 100.0)
            .bind(users)
            .bind(orders)
            .execute(pool)
            .await?;
    }

    Ok(())
}

/// Deterministic hash-based pseudo-random in [0, 1) so reseeds match.
fn pseudo_random(n: i64) -> f64 {
    let x = (n as f64 * 127.1 + 311.7).sin() * 43758.5453;
    x - x.floor()
}

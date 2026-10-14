//! IPC Commands — Dashboard Template.
//!
//! Small, explicit surface: metrics for the dashboard charts and static
//! app info for the settings page. Extend with your own domain commands.

use crate::db;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use tauri::AppHandle;

/// One day of dashboard metrics
#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct MetricRow {
    pub date: String,
    pub revenue: f64,
    pub users: i64,
    pub orders: i64,
}

/// Static runtime info shown on the settings page
#[derive(Debug, Serialize, Deserialize)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub platform: String,
    pub tauri: String,
    pub webview: String,
}

/// All seeded metrics, ordered by date ascending (oldest first).
#[tauri::command]
pub async fn get_metrics() -> Result<Vec<MetricRow>, String> {
    let pool = db::pool();
    let rows = sqlx::query_as::<_, MetricRow>(
        "SELECT date, revenue, users, orders FROM metrics ORDER BY date ASC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

/// Static app + runtime info for the desktop shell.
#[tauri::command]
pub async fn get_app_info(app: AppHandle) -> Result<AppInfo, String> {
    let config = app.config();
    Ok(AppInfo {
        name: config
            .product_name
            .clone()
            .unwrap_or_else(|| "Dashboard".to_string()),
        version: config
            .version
            .clone()
            .unwrap_or_else(|| env!("CARGO_PKG_VERSION").to_string()),
        platform: std::env::consts::OS.to_string(),
        tauri: app.package_info().version.to_string(),
        webview: tauri::webview_version().map_err(|e| e.to_string())?,
    })
}

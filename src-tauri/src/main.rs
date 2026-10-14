//! Tauri 2.0 Dashboard Template — Main Entry Point.
//!
//! Bootstrap sequence (Rust side):
//! 1. Initialize the Tauri app
//! 2. Set up the SQLite connection pool + seed demo data
//! 3. Register IPC command handlers

// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use dashboard_template_lib::{commands, db};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize the database during app setup (before the window shows)
            let app_handle = app.handle().clone();
            tauri::async_runtime::block_on(async {
                db::initialize(&app_handle)
                    .await
                    .expect("Failed to initialize database");
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_metrics,
            commands::get_app_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

//! Tauri 2.0 TTS Workshop — Main Entry Point
//!
//! §1: Bootstrap sequence (Rust side):
//! 1. Initialize Tauri app
//! 2. Set up SQLite connection pool
//! 3. Run migrations
//! 4. Register IPC command handlers

// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tts_workshop_lib::{commands, db};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // §1: Initialize database during app setup (before window shows)
            let app_handle = app.handle().clone();
            tauri::async_runtime::block_on(async {
                db::initialize(&app_handle)
                    .await
                    .expect("Failed to initialize database");
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // DB init
            commands::db_initialize,
            // Voice commands
            commands::list_voices,
            commands::upsert_voice,
            commands::delete_voice,
            commands::rename_voice,
            // History commands
            commands::list_history,
            commands::add_history,
            commands::delete_history,
            commands::update_history,
            // Audio file commands
            commands::save_audio_file,
            commands::get_audio_dir_path,
            commands::copy_audio_to_dir,
            // TTS API proxy commands (routed through Rust to avoid webview fetch issues)
            commands::generate_tts,
            commands::list_tts_references,
            commands::add_tts_reference,
            commands::delete_tts_reference,
            commands::rename_tts_reference,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

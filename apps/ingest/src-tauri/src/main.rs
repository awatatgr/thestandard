// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use thestandard_ingest::commands;
use thestandard_ingest::settings::load_settings;
use thestandard_ingest::state::AppState;

fn main() {
    let settings = load_settings();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .manage(AppState::new(settings))
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::save_settings,
            commands::import_web_config,
            commands::test_api_connection,
            commands::scan_volumes,
            commands::list_video_files,
            commands::classify_files,
            commands::get_thumbnail,
            commands::check_ffmpeg,
            commands::start_pipeline,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

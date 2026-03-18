use crate::camera::{self, FileClassification};
use crate::error::AppError;
use crate::pipeline::{self, PipelineRequest};
use crate::settings::{save_settings_to_disk, AppSettings};
use crate::ssd::{self, DetectedVolume, VideoFileInfo};
use crate::state::AppState;
use tauri::{AppHandle, State};

// --- Settings ---

#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, AppError> {
    let settings = state.settings.read().await;
    Ok(settings.clone())
}

#[tauri::command]
pub async fn save_settings(
    state: State<'_, AppState>,
    settings: AppSettings,
) -> Result<(), AppError> {
    save_settings_to_disk(&settings).map_err(|e| AppError::Settings(e.to_string()))?;
    let mut current = state.settings.write().await;
    *current = settings;
    Ok(())
}

#[tauri::command]
pub async fn import_web_config(
    state: State<'_, AppState>,
    json: String,
) -> Result<AppSettings, AppError> {
    #[derive(serde::Deserialize)]
    struct WebConfig {
        api_endpoint: Option<String>,
        admin_token: Option<String>,
        bunny_cdn_hostname: Option<String>,
    }

    let config: WebConfig = serde_json::from_str(&json)?;
    let mut settings = state.settings.read().await.clone();

    if let Some(v) = config.api_endpoint {
        settings.api_endpoint = Some(v);
    }
    if let Some(v) = config.admin_token {
        settings.admin_token = Some(v);
    }
    if let Some(v) = config.bunny_cdn_hostname {
        settings.bunny_cdn_hostname = Some(v);
    }

    save_settings_to_disk(&settings).map_err(|e| AppError::Settings(e.to_string()))?;
    let mut current = state.settings.write().await;
    *current = settings.clone();
    Ok(settings)
}

#[tauri::command]
pub async fn test_api_connection(
    state: State<'_, AppState>,
) -> Result<ConnectionStatus, AppError> {
    let settings = state.settings.read().await;
    let endpoint = settings
        .api_endpoint
        .as_ref()
        .ok_or_else(|| AppError::NotConfigured("api_endpoint".to_string()))?;
    let token = settings
        .admin_token
        .as_ref()
        .ok_or_else(|| AppError::NotConfigured("admin_token".to_string()))?;

    let url = format!("{}/api/admin/stats", endpoint.trim_end_matches('/'));
    let client = reqwest::Client::new();
    let res = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await?;

    if res.status().is_success() {
        Ok(ConnectionStatus {
            connected: true,
            message: "API接続成功".to_string(),
        })
    } else {
        Ok(ConnectionStatus {
            connected: false,
            message: format!("HTTP {}", res.status()),
        })
    }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct ConnectionStatus {
    pub connected: bool,
    pub message: String,
}

// --- SSD Detection ---

#[tauri::command]
pub fn scan_volumes() -> Result<Vec<DetectedVolume>, AppError> {
    ssd::scan_volumes()
}

#[tauri::command]
pub fn list_video_files(volume_path: String) -> Result<Vec<VideoFileInfo>, AppError> {
    Ok(ssd::list_video_files(std::path::Path::new(&volume_path)))
}

// --- Camera Classification ---

#[tauri::command]
pub async fn classify_files(
    state: State<'_, AppState>,
    paths: Vec<String>,
) -> Result<Vec<FileClassification>, AppError> {
    let settings = state.settings.read().await;
    Ok(camera::classify_files(&paths, &settings.cameras))
}

// --- ffmpeg ---

#[tauri::command]
pub fn check_ffmpeg() -> Result<FfmpegInfo, AppError> {
    let ffmpeg = find_exec("ffmpeg");
    let ffprobe = find_exec("ffprobe");

    match (&ffmpeg, &ffprobe) {
        (Some(ffmpeg_path), Some(_)) => {
            let version = get_ffmpeg_version(ffmpeg_path);
            Ok(FfmpegInfo {
                available: true,
                path: ffmpeg_path.clone(),
                version,
            })
        }
        _ => Ok(FfmpegInfo {
            available: false,
            path: String::new(),
            version: None,
        }),
    }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct FfmpegInfo {
    pub available: bool,
    pub path: String,
    pub version: Option<String>,
}

fn find_exec(name: &str) -> Option<String> {
    if let Ok(output) = std::process::Command::new("which").arg(name).output() {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                return Some(path);
            }
        }
    }
    let brew = format!("/opt/homebrew/bin/{}", name);
    if std::path::Path::new(&brew).exists() {
        return Some(brew);
    }
    None
}

fn get_ffmpeg_version(path: &str) -> Option<String> {
    let output = std::process::Command::new(path)
        .args(["-version"])
        .output()
        .ok()?;
    let first_line = String::from_utf8_lossy(&output.stdout)
        .lines()
        .next()?
        .to_string();
    Some(first_line)
}

// --- Pipeline ---

#[tauri::command]
pub async fn start_pipeline(
    app: AppHandle,
    state: State<'_, AppState>,
    request: PipelineRequest,
) -> Result<String, AppError> {
    let pipeline_id = uuid::Uuid::new_v4().to_string();
    let settings = state.settings.read().await.clone();

    let pid = pipeline_id.clone();
    tauri::async_runtime::spawn(async move {
        pipeline::run_pipeline(app, pid, request, settings).await;
    });

    Ok(pipeline_id)
}

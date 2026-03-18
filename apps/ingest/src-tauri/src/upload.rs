use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

use crate::error::AppError;
use crate::settings::AppSettings;

#[derive(Debug, Clone, Serialize)]
pub struct BunnyUploadResult {
    pub video_guid: String,
    pub hls_url: String,
    pub thumbnail_url: String,
}

#[derive(Deserialize)]
struct CreateVideoResponse {
    guid: String,
}

#[derive(Clone, Serialize)]
struct UploadProgress {
    pipeline_id: String,
    file_path: String,
    step: String,
    progress_pct: f32,
    message: String,
}

pub async fn upload_to_bunny(
    app: &AppHandle,
    pipeline_id: &str,
    file_path: &str,
    title: &str,
    settings: &AppSettings,
) -> Result<BunnyUploadResult, AppError> {
    let api_key = settings
        .bunny_api_key
        .as_ref()
        .ok_or_else(|| AppError::NotConfigured("bunny_api_key".to_string()))?;
    let library_id = settings
        .bunny_library_id
        .as_ref()
        .ok_or_else(|| AppError::NotConfigured("bunny_library_id".to_string()))?;
    let cdn_hostname = settings
        .bunny_cdn_hostname
        .as_ref()
        .ok_or_else(|| AppError::NotConfigured("bunny_cdn_hostname".to_string()))?;

    let client = reqwest::Client::new();

    // Step 1: Create video entry
    let _ = app.emit(
        "pipeline:progress",
        UploadProgress {
            pipeline_id: pipeline_id.to_string(),
            file_path: file_path.to_string(),
            step: "uploading".to_string(),
            progress_pct: 0.0,
            message: "Creating video entry...".to_string(),
        },
    );

    let create_url = format!(
        "https://video.bunnycdn.com/library/{}/videos",
        library_id
    );
    let create_res = client
        .post(&create_url)
        .header("AccessKey", api_key.as_str())
        .header("Content-Type", "application/json")
        .body(format!(r#"{{"title":"{}"}}"#, title))
        .send()
        .await?;

    if !create_res.status().is_success() {
        let status = create_res.status();
        let body = create_res.text().await.unwrap_or_default();
        return Err(AppError::UploadError(format!(
            "Failed to create video: HTTP {} - {}",
            status, body
        )));
    }

    let created: CreateVideoResponse = create_res.json().await.map_err(|e| {
        AppError::UploadError(format!("Failed to parse create response: {}", e))
    })?;

    // Step 2: Upload file binary
    let _ = app.emit(
        "pipeline:progress",
        UploadProgress {
            pipeline_id: pipeline_id.to_string(),
            file_path: file_path.to_string(),
            step: "uploading".to_string(),
            progress_pct: 10.0,
            message: "Uploading file...".to_string(),
        },
    );

    let file_bytes = tokio::fs::read(file_path).await?;

    let upload_url = format!(
        "https://video.bunnycdn.com/library/{}/videos/{}",
        library_id, created.guid
    );

    let upload_res = client
        .put(&upload_url)
        .header("AccessKey", api_key.as_str())
        .header("Content-Type", "application/octet-stream")
        .body(file_bytes)
        .send()
        .await?;

    if !upload_res.status().is_success() {
        let status = upload_res.status();
        let body = upload_res.text().await.unwrap_or_default();
        return Err(AppError::UploadError(format!(
            "Failed to upload: HTTP {} - {}",
            status, body
        )));
    }

    let _ = app.emit(
        "pipeline:progress",
        UploadProgress {
            pipeline_id: pipeline_id.to_string(),
            file_path: file_path.to_string(),
            step: "uploading".to_string(),
            progress_pct: 100.0,
            message: "Upload complete".to_string(),
        },
    );

    Ok(BunnyUploadResult {
        video_guid: created.guid.clone(),
        hls_url: format!("https://{}/{}/playlist.m3u8", cdn_hostname, created.guid),
        thumbnail_url: format!("https://{}/{}/thumbnail.jpg", cdn_hostname, created.guid),
    })
}

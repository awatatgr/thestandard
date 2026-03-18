use serde::Serialize;

use crate::error::AppError;
use crate::settings::AppSettings;

#[derive(Debug, Clone, Serialize, serde::Deserialize)]
pub struct VideoAngleInput {
    pub id: String,
    pub label: String,
    #[serde(rename = "bunnyStreamId", skip_serializing_if = "Option::is_none")]
    pub bunny_stream_id: Option<String>,
    #[serde(rename = "videoUrl", skip_serializing_if = "Option::is_none")]
    pub video_url: Option<String>,
    #[serde(rename = "subtitleUrl", skip_serializing_if = "Option::is_none")]
    pub subtitle_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, serde::Deserialize)]
pub struct VideoInput {
    pub id: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub category: String,
    pub angles: Vec<VideoAngleInput>,
    #[serde(rename = "durationSeconds", skip_serializing_if = "Option::is_none")]
    pub duration_seconds: Option<u32>,
    #[serde(rename = "recordedAt", skip_serializing_if = "Option::is_none")]
    pub recorded_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chapter: Option<String>,
}

pub async fn register_video(
    video: &VideoInput,
    settings: &AppSettings,
) -> Result<(), AppError> {
    let endpoint = settings
        .api_endpoint
        .as_ref()
        .ok_or_else(|| AppError::NotConfigured("api_endpoint".to_string()))?;
    let token = settings
        .admin_token
        .as_ref()
        .ok_or_else(|| AppError::NotConfigured("admin_token".to_string()))?;

    let url = format!("{}/api/videos", endpoint.trim_end_matches('/'));
    let client = reqwest::Client::new();

    let res = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .json(video)
        .send()
        .await?;

    if res.status().is_success() {
        Ok(())
    } else {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        Err(AppError::ApiError(format!("HTTP {} - {}", status, body)))
    }
}

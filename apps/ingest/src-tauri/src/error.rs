use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Settings error: {0}")]
    Settings(String),

    #[error("ffmpeg not found")]
    FfmpegNotFound,

    #[error("ffprobe error: {0}")]
    FfprobeError(String),

    #[error("Encoding failed: {0}")]
    EncodeFailed(String),

    #[error("Upload error: {0}")]
    UploadError(String),

    #[error("API error: {0}")]
    ApiError(String),

    #[error("Not configured: {0}")]
    NotConfigured(String),

    #[error("ffmpeg error: {0}")]
    Ffmpeg(String),

    #[error("Pipeline cancelled")]
    Cancelled,

    #[error("Network error: {0}")]
    Network(String),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<reqwest::Error> for AppError {
    fn from(e: reqwest::Error) -> Self {
        AppError::Network(e.to_string())
    }
}

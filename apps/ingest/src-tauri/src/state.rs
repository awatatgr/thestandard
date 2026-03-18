use crate::settings::AppSettings;
use std::collections::HashMap;
use tokio::sync::RwLock;

pub struct AppState {
    pub settings: RwLock<AppSettings>,
    pub pipelines: RwLock<HashMap<String, PipelineState>>,
}

impl AppState {
    pub fn new(settings: AppSettings) -> Self {
        Self {
            settings: RwLock::new(settings),
            pipelines: RwLock::new(HashMap::new()),
        }
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PipelineState {
    pub id: String,
    pub files: Vec<PipelineFileState>,
    pub started_at: String,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PipelineFileState {
    pub source_path: String,
    pub camera_id: String,
    pub step: PipelineStep,
    pub progress_pct: f32,
    pub copied_path: Option<String>,
    pub encoded_path: Option<String>,
    pub bunny_guid: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PipelineStep {
    Pending,
    Copying,
    CopyDone,
    Encoding,
    EncodeDone,
    Uploading,
    UploadDone,
    Registering,
    Complete,
    Failed,
}

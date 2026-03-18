use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub bunny_api_key: Option<String>,
    pub bunny_library_id: Option<String>,
    pub bunny_cdn_hostname: Option<String>,
    pub api_endpoint: Option<String>,
    pub admin_token: Option<String>,
    pub lut_path: Option<String>,
    pub footage_base: Option<String>,
    pub output_resolution: Option<String>,
    pub acam_model: Option<String>,
    pub bcam_model: Option<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            bunny_api_key: None,
            bunny_library_id: None,
            bunny_cdn_hostname: None,
            api_endpoint: None,
            admin_token: None,
            lut_path: None,
            footage_base: None,
            output_resolution: Some("1920x1080".to_string()),
            acam_model: Some("iPhone 15 Pro Max".to_string()),
            bcam_model: Some("iPhone 16 Pro".to_string()),
        }
    }
}

fn settings_path() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("thestandard-ingest")
        .join("settings.json")
}

pub fn load_settings() -> AppSettings {
    let path = settings_path();
    if path.exists() {
        if let Ok(content) = std::fs::read_to_string(&path) {
            if let Ok(settings) = serde_json::from_str(&content) {
                return settings;
            }
        }
    }
    AppSettings::default()
}

pub fn save_settings_to_disk(settings: &AppSettings) -> Result<(), Box<dyn std::error::Error>> {
    let path = settings_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let json = serde_json::to_string_pretty(settings)?;
    std::fs::write(path, json)?;
    Ok(())
}

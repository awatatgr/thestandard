use serde::Serialize;
use std::process::Command;

use crate::settings::CameraConfig;

#[derive(Debug, Clone, Serialize)]
pub struct FileClassification {
    pub path: String,
    pub camera_id: Option<String>,
    pub camera_label: Option<String>,
    pub model_name: Option<String>,
}

/// Detect camera model from a video file using ffprobe, then mdls as fallback.
pub fn detect_camera_model(file_path: &str) -> Option<String> {
    // Try ffprobe first
    if let Some(model) = detect_via_ffprobe(file_path) {
        return Some(model);
    }
    // Fallback: macOS Spotlight metadata
    if let Some(model) = detect_via_mdls(file_path) {
        return Some(model);
    }
    None
}

fn detect_via_ffprobe(file_path: &str) -> Option<String> {
    let output = Command::new("ffprobe")
        .args([
            "-v", "quiet",
            "-show_entries", "format_tags=com.apple.quicktime.model",
            "-of", "default=noprint_wrappers=1:nokey=1",
            file_path,
        ])
        .output()
        .ok()?;

    let model = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if model.is_empty() {
        None
    } else {
        Some(model)
    }
}

fn detect_via_mdls(file_path: &str) -> Option<String> {
    let output = Command::new("mdls")
        .args(["-name", "kMDItemAcquisitionModel", file_path])
        .output()
        .ok()?;

    let raw = String::from_utf8_lossy(&output.stdout);
    // mdls output: kMDItemAcquisitionModel = "iPhone 15 Pro Max"
    let model = raw
        .split('=')
        .nth(1)?
        .trim()
        .trim_matches('"')
        .to_string();

    if model == "(null)" || model.is_empty() {
        None
    } else {
        Some(model)
    }
}

/// Classify a file against the configured camera list.
/// Uses substring matching on model_pattern.
pub fn classify_file(
    file_path: &str,
    cameras: &[CameraConfig],
) -> FileClassification {
    let model_name = detect_camera_model(file_path);

    let matched = model_name.as_ref().and_then(|model| {
        cameras.iter().find(|c| model.contains(&c.model_pattern))
    });

    FileClassification {
        path: file_path.to_string(),
        camera_id: matched.map(|c| c.id.clone()),
        camera_label: matched.map(|c| c.label.clone()),
        model_name,
    }
}

/// Classify multiple files.
pub fn classify_files(
    file_paths: &[String],
    cameras: &[CameraConfig],
) -> Vec<FileClassification> {
    file_paths
        .iter()
        .map(|path| classify_file(path, cameras))
        .collect()
}

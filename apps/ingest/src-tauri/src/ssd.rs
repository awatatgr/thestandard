use serde::Serialize;
use std::path::Path;
use walkdir::WalkDir;

use crate::error::AppError;

const VIDEO_EXTENSIONS: &[&str] = &["mov", "mp4", "m4v"];
const SKIP_VOLUMES: &[&str] = &["Macintosh HD", "Macintosh HD - Data", "Recovery"];

#[derive(Debug, Clone, Serialize)]
pub struct DetectedVolume {
    pub path: String,
    pub name: String,
    pub video_count: u32,
    pub total_size_bytes: u64,
}

pub fn scan_volumes() -> Result<Vec<DetectedVolume>, AppError> {
    let volumes_dir = Path::new("/Volumes");
    if !volumes_dir.exists() {
        return Ok(vec![]);
    }

    let mut result = vec![];

    for entry in std::fs::read_dir(volumes_dir)? {
        let entry = entry?;
        let name = entry.file_name().to_string_lossy().to_string();

        if SKIP_VOLUMES.contains(&name.as_str()) {
            continue;
        }

        let vol_path = entry.path();
        if !vol_path.is_dir() {
            continue;
        }

        let (count, size) = count_video_files(&vol_path);
        if count > 0 {
            result.push(DetectedVolume {
                path: vol_path.to_string_lossy().to_string(),
                name,
                video_count: count,
                total_size_bytes: size,
            });
        }
    }

    Ok(result)
}

fn count_video_files(dir: &Path) -> (u32, u64) {
    let mut count = 0u32;
    let mut size = 0u64;

    for entry in WalkDir::new(dir).max_depth(3).into_iter().flatten() {
        if !entry.file_type().is_file() {
            continue;
        }
        if let Some(ext) = entry.path().extension() {
            let ext_lower = ext.to_string_lossy().to_lowercase();
            if VIDEO_EXTENSIONS.contains(&ext_lower.as_str()) {
                count += 1;
                size += entry.metadata().map(|m| m.len()).unwrap_or(0);
            }
        }
    }

    (count, size)
}

pub fn list_video_files(dir: &Path) -> Vec<VideoFileInfo> {
    let mut files = vec![];

    for entry in WalkDir::new(dir).max_depth(3).into_iter().flatten() {
        if !entry.file_type().is_file() {
            continue;
        }
        if let Some(ext) = entry.path().extension() {
            let ext_lower = ext.to_string_lossy().to_lowercase();
            if VIDEO_EXTENSIONS.contains(&ext_lower.as_str()) {
                let path = entry.path().to_string_lossy().to_string();
                let name = entry.file_name().to_string_lossy().to_string();
                let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
                files.push(VideoFileInfo {
                    path,
                    name,
                    size_bytes: size,
                });
            }
        }
    }

    files.sort_by(|a, b| a.name.cmp(&b.name));
    files
}

#[derive(Debug, Clone, Serialize)]
pub struct VideoFileInfo {
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
}

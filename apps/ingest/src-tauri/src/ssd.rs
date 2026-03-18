use serde::Serialize;
use std::path::Path;
use std::process::Command;
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
    let base = dir.to_string_lossy().to_string();

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

                // Relative directory from volume root
                let relative_dir = entry
                    .path()
                    .parent()
                    .map(|p| {
                        let p_str = p.to_string_lossy().to_string();
                        p_str.strip_prefix(&base).unwrap_or(&p_str).trim_start_matches('/').to_string()
                    })
                    .unwrap_or_default();

                // Get duration and creation time via ffprobe
                let (duration_secs, created_at) = probe_metadata(&path);

                files.push(VideoFileInfo {
                    path,
                    name,
                    size_bytes: size,
                    relative_dir,
                    duration_secs,
                    created_at,
                });
            }
        }
    }

    files.sort_by(|a, b| a.name.cmp(&b.name));
    files
}

/// Extract duration and creation_time from a video file using ffprobe.
fn probe_metadata(path: &str) -> (Option<f64>, Option<String>) {
    let output = Command::new("ffprobe")
        .args([
            "-v", "quiet",
            "-show_entries", "format=duration:format_tags=creation_time",
            "-of", "default=noprint_wrappers=1",
            path,
        ])
        .output();

    let output = match output {
        Ok(o) if o.status.success() => o,
        _ => return (None, None),
    };

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut duration = None;
    let mut created = None;

    for line in stdout.lines() {
        if let Some(val) = line.strip_prefix("duration=") {
            duration = val.parse::<f64>().ok();
        } else if let Some(val) = line.strip_prefix("TAG:creation_time=") {
            created = Some(val.to_string());
        }
    }

    (duration, created)
}

/// Generate a JPEG thumbnail (base64-encoded) for a video file.
pub fn generate_thumbnail(path: &str) -> Result<String, AppError> {
    use std::io::Read;

    let tmp = std::env::temp_dir().join(format!("ingest_thumb_{}.jpg", uuid::Uuid::new_v4()));
    let status = Command::new("ffmpeg")
        .args([
            "-y", "-i", path,
            "-ss", "1",
            "-vframes", "1",
            "-vf", "scale=320:-1",
            "-q:v", "6",
            tmp.to_string_lossy().as_ref(),
        ])
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status();

    match status {
        Ok(s) if s.success() => {}
        _ => return Err(AppError::Ffmpeg("thumbnail generation failed".to_string())),
    }

    let mut buf = Vec::new();
    std::fs::File::open(&tmp)
        .and_then(|mut f| f.read_to_end(&mut buf))
        .map_err(|e| AppError::Ffmpeg(e.to_string()))?;
    let _ = std::fs::remove_file(&tmp);

    use base64::Engine;
    Ok(base64::engine::general_purpose::STANDARD.encode(&buf))
}

#[derive(Debug, Clone, Serialize)]
pub struct VideoFileInfo {
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    pub relative_dir: String,
    pub duration_secs: Option<f64>,
    pub created_at: Option<String>,
}

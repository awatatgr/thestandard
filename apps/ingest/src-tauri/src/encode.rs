use regex::Regex;
use std::io::BufRead;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::{AppHandle, Emitter};

use crate::error::AppError;
use crate::settings::AppSettings;

const APPLE_LOG_CURVES: &str =
    "curves=all='0/0 0.15/0.0 0.30/0.22 0.50/0.50 0.70/0.78 0.85/0.95 1/1',eq=contrast=1.15:saturation=1.3";

#[derive(Clone, serde::Serialize)]
struct EncodeProgress {
    pipeline_id: String,
    file_path: String,
    step: String,
    progress_pct: f32,
    message: String,
}

pub fn find_lut(settings: &AppSettings, footage_dir: Option<&Path>) -> Option<PathBuf> {
    // 1. User-specified path
    if let Some(ref p) = settings.lut_path {
        let path = PathBuf::from(p);
        if path.exists() {
            return Some(path);
        }
    }

    let candidates: Vec<PathBuf> = {
        let mut c = vec![];
        if let Some(dir) = footage_dir {
            c.push(dir.join("AppleLogToRec709.cube"));
        }
        if let Some(home) = dirs::home_dir() {
            c.push(home.join("LUTs/AppleLogToRec709.cube"));
            c.push(home.join("LUTs/Apple Log to Rec.709.cube"));
        }
        c.push(PathBuf::from(
            "/Library/Application Support/Blackmagic Design/DaVinci Resolve/LUT/Apple/Apple Log to Rec.709.cube",
        ));
        c
    };

    candidates.into_iter().find(|p| p.exists())
}

fn build_filter_chain(lut: Option<&Path>, resolution: &str) -> String {
    let (w, h) = parse_resolution(resolution);
    let color = match lut {
        Some(path) => format!("lut3d='{}'", path.display()),
        None => APPLE_LOG_CURVES.to_string(),
    };
    format!(
        "{},scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2",
        color, w, h, w, h
    )
}

fn parse_resolution(res: &str) -> (u32, u32) {
    let parts: Vec<&str> = res.split('x').collect();
    if parts.len() == 2 {
        let w = parts[0].parse().unwrap_or(1920);
        let h = parts[1].parse().unwrap_or(1080);
        (w, h)
    } else {
        (1920, 1080)
    }
}

/// Get video duration in seconds using ffprobe.
fn get_duration(ffprobe_path: &str, input: &Path) -> Option<f64> {
    let output = Command::new(ffprobe_path)
        .args([
            "-v", "quiet",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
        ])
        .arg(input)
        .output()
        .ok()?;

    let s = String::from_utf8_lossy(&output.stdout);
    s.trim().parse().ok()
}

pub fn encode_file(
    app: &AppHandle,
    pipeline_id: &str,
    ffmpeg_path: &str,
    ffprobe_path: &str,
    input: &Path,
    output: &Path,
    settings: &AppSettings,
    footage_dir: Option<&Path>,
) -> Result<(), AppError> {
    if let Some(parent) = output.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let lut = find_lut(settings, footage_dir);
    let resolution = settings
        .output_resolution
        .as_deref()
        .unwrap_or("1920x1080");
    let vf = build_filter_chain(lut.as_deref(), resolution);

    let total_duration = get_duration(ffprobe_path, input).unwrap_or(0.0);

    let mut child = Command::new(ffmpeg_path)
        .args([
            "-hide_banner",
            "-loglevel", "warning",
            "-stats",
            "-i",
        ])
        .arg(input)
        .args([
            "-vf", &vf,
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "20",
            "-c:a", "aac",
            "-b:a", "192k",
            "-r", "24",
            "-movflags", "+faststart",
            "-y",
        ])
        .arg(output)
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| AppError::EncodeFailed(format!("Failed to start ffmpeg: {}", e)))?;

    let stderr = child.stderr.take().unwrap();
    let reader = std::io::BufReader::new(stderr);
    let time_re = Regex::new(r"time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})").unwrap();

    let file_name = input
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    for line in reader.lines().map_while(Result::ok) {
        if let Some(caps) = time_re.captures(&line) {
            let h: f64 = caps[1].parse().unwrap_or(0.0);
            let m: f64 = caps[2].parse().unwrap_or(0.0);
            let s: f64 = caps[3].parse().unwrap_or(0.0);
            let cs: f64 = caps[4].parse().unwrap_or(0.0);
            let current = h * 3600.0 + m * 60.0 + s + cs / 100.0;

            let pct = if total_duration > 0.0 {
                (current / total_duration * 100.0).min(100.0) as f32
            } else {
                0.0
            };

            let _ = app.emit(
                "pipeline:progress",
                EncodeProgress {
                    pipeline_id: pipeline_id.to_string(),
                    file_path: input.to_string_lossy().to_string(),
                    step: "encoding".to_string(),
                    progress_pct: pct,
                    message: format!("{} ({:.0}%)", file_name, pct),
                },
            );
        }
    }

    let status = child.wait().map_err(|e| AppError::EncodeFailed(e.to_string()))?;
    if !status.success() {
        return Err(AppError::EncodeFailed(format!(
            "ffmpeg exited with code {}",
            status.code().unwrap_or(-1)
        )));
    }

    Ok(())
}

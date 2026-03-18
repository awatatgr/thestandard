use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter};

use crate::api::{self, VideoAngleInput, VideoInput};
use crate::copy;
use crate::encode;
use crate::error::AppError;
use crate::settings::AppSettings;
// state types will be used for persistence in future iteration
use crate::upload;

#[derive(Debug, Clone, serde::Deserialize)]
pub struct PipelineFileInput {
    pub source_path: String,
    pub camera_id: String,
    pub camera_label: String,
}

#[derive(Debug, Clone, serde::Deserialize)]
pub struct PipelineRequest {
    pub files: Vec<PipelineFileInput>,
    pub video_id: String,
    pub video_title: String,
    pub video_category: String,
}

#[derive(Clone, serde::Serialize)]
struct PipelineCompleteEvent {
    pipeline_id: String,
    success_count: u32,
    error_count: u32,
}

#[derive(Clone, serde::Serialize)]
struct PipelineErrorEvent {
    pipeline_id: String,
    file_path: String,
    step: String,
    error: String,
}

pub async fn run_pipeline(
    app: AppHandle,
    pipeline_id: String,
    request: PipelineRequest,
    settings: AppSettings,
) {
    let footage_base = settings
        .footage_base
        .as_deref()
        .unwrap_or("~/footage");
    let footage_base = shellexpand_home(footage_base);
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let day_dir = PathBuf::from(&footage_base).join(&today);

    let mut success_count = 0u32;
    let mut error_count = 0u32;

    // Group files by camera_id for angle-based processing
    let mut angle_results: Vec<(String, String, Option<String>)> = vec![]; // (camera_id, camera_label, bunny_guid)

    for file_input in &request.files {
        let result = process_single_file(
            &app,
            &pipeline_id,
            file_input,
            &day_dir,
            &settings,
        )
        .await;

        match result {
            Ok(bunny_guid) => {
                success_count += 1;
                angle_results.push((
                    file_input.camera_id.clone(),
                    file_input.camera_label.clone(),
                    bunny_guid,
                ));
            }
            Err(e) => {
                error_count += 1;
                let _ = app.emit(
                    "pipeline:error",
                    PipelineErrorEvent {
                        pipeline_id: pipeline_id.clone(),
                        file_path: file_input.source_path.clone(),
                        step: "pipeline".to_string(),
                        error: e.to_string(),
                    },
                );
            }
        }
    }

    // Register video with all angles
    if !angle_results.is_empty() {
        let angles: Vec<VideoAngleInput> = angle_results
            .iter()
            .map(|(cam_id, cam_label, guid)| VideoAngleInput {
                id: cam_id.clone(),
                label: cam_label.clone(),
                bunny_stream_id: guid.clone(),
                video_url: None,
                subtitle_url: None,
            })
            .collect();

        let video = VideoInput {
            id: request.video_id.clone(),
            title: request.video_title.clone(),
            description: None,
            category: request.video_category.clone(),
            angles,
            duration_seconds: None,
            recorded_at: Some(today),
            chapter: None,
        };

        if let Err(e) = api::register_video(&video, &settings).await {
            let _ = app.emit(
                "pipeline:error",
                PipelineErrorEvent {
                    pipeline_id: pipeline_id.clone(),
                    file_path: String::new(),
                    step: "registering".to_string(),
                    error: e.to_string(),
                },
            );
            error_count += 1;
        }
    }

    let _ = app.emit(
        "pipeline:complete",
        PipelineCompleteEvent {
            pipeline_id,
            success_count,
            error_count,
        },
    );
}

async fn process_single_file(
    app: &AppHandle,
    pipeline_id: &str,
    input: &PipelineFileInput,
    day_dir: &Path,
    settings: &AppSettings,
) -> Result<Option<String>, AppError> {
    let source = Path::new(&input.source_path);

    // Step 1: Copy
    let cam_dir = day_dir.join(&input.camera_id);
    let dest = cam_dir.join(source.file_name().unwrap_or_default());
    copy::copy_file_with_progress(app, pipeline_id, source, &dest)?;

    // Step 2: Encode
    let export_dir = day_dir.join("export").join(&input.camera_id);
    let stem = source
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy();
    let encoded = export_dir.join(format!("{}.mp4", stem));

    // Find ffmpeg/ffprobe in PATH or common locations
    let ffmpeg = find_executable("ffmpeg")?;
    let ffprobe = find_executable("ffprobe")?;

    encode::encode_file(
        app,
        pipeline_id,
        &ffmpeg,
        &ffprobe,
        &dest,
        &encoded,
        settings,
        Some(day_dir),
    )?;

    // Step 3: Upload (if Bunny configured)
    let bunny_guid = if settings.bunny_api_key.is_some() {
        let title = format!(
            "{} - {}",
            input.camera_label,
            source.file_stem().unwrap_or_default().to_string_lossy()
        );
        let result = upload::upload_to_bunny(
            app,
            pipeline_id,
            encoded.to_str().unwrap_or(""),
            &title,
            settings,
        )
        .await?;
        Some(result.video_guid)
    } else {
        None
    };

    Ok(bunny_guid)
}

fn find_executable(name: &str) -> Result<String, AppError> {
    // Check PATH
    if let Ok(output) = std::process::Command::new("which").arg(name).output() {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                return Ok(path);
            }
        }
    }
    // Homebrew
    let brew_path = format!("/opt/homebrew/bin/{}", name);
    if Path::new(&brew_path).exists() {
        return Ok(brew_path);
    }
    Err(AppError::FfmpegNotFound)
}

fn shellexpand_home(path: &str) -> String {
    if path.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            return format!("{}{}", home.display(), &path[1..]);
        }
    }
    path.to_string()
}

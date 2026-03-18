use std::io::{BufReader, BufWriter, Read, Write};
use std::path::Path;
use tauri::{AppHandle, Emitter};

use crate::error::AppError;

const CHUNK_SIZE: usize = 8 * 1024 * 1024; // 8MB

#[derive(Clone, serde::Serialize)]
struct CopyProgress {
    pipeline_id: String,
    file_path: String,
    step: String,
    progress_pct: f32,
    message: String,
}

pub fn copy_file_with_progress(
    app: &AppHandle,
    pipeline_id: &str,
    src: &Path,
    dest: &Path,
) -> Result<(), AppError> {
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let src_file = std::fs::File::open(src)?;
    let total = src_file.metadata()?.len();
    let mut reader = BufReader::new(src_file);

    let dest_file = std::fs::File::create(dest)?;
    let mut writer = BufWriter::new(dest_file);

    let mut copied: u64 = 0;
    let mut buf = vec![0u8; CHUNK_SIZE];
    let file_name = src
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    loop {
        let n = reader.read(&mut buf)?;
        if n == 0 {
            break;
        }
        writer.write_all(&buf[..n])?;
        copied += n as u64;

        let pct = if total > 0 {
            (copied as f64 / total as f64 * 100.0) as f32
        } else {
            0.0
        };

        let _ = app.emit(
            "pipeline:progress",
            CopyProgress {
                pipeline_id: pipeline_id.to_string(),
                file_path: src.to_string_lossy().to_string(),
                step: "copying".to_string(),
                progress_pct: pct,
                message: format!("{} ({:.0}%)", file_name, pct),
            },
        );
    }

    writer.flush()?;
    Ok(())
}

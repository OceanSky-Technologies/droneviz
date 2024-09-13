use std::{os::windows::process::CommandExt, path::PathBuf, process::Command};

use tauri::Manager;

// see https://learn.microsoft.com/en-us/windows/win32/procthread/process-creation-flags
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[tauri::command]
fn start_backend(path: &PathBuf) {
    Command::new(path)
        .creation_flags(CREATE_NO_WINDOW) // hide console window
        .spawn()
        .expect("failed to execute process");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(move |app| {
            let run_script = if cfg!(target_os = "windows") {
                "_up_/dist/backend/run.cmd"
            } else {
                panic!("OS not supported")
            };

            let path = app
                .path()
                .resolve(run_script, tauri::path::BaseDirectory::Resource)
                .unwrap();

            start_backend(&path);

            // TODO: shut down backend when this program exits

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

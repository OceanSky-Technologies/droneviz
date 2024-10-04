#[cfg(target_os = "windows")]
use std::{os::windows::process::CommandExt, process::Command};

// see https://learn.microsoft.com/en-us/windows/win32/procthread/process-creation-flags
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

use tauri::{AppHandle, Manager, RunEvent};

#[tauri::command]
fn open_webcam_window(app: tauri::AppHandle) {
    // Create a new window
    #[cfg(target_os = "windows")]
    {
        let new_window = tauri::WebviewWindowBuilder::new(
            &app,
            "video",
            tauri::WebviewUrl::App("video.html".into()),
        )
        .title("Video")
        .visible(true)
        .build()
        .expect("Failed to create new window");

        println!("now");
    }
}

#[tauri::command]
fn start_backend(app: &AppHandle) {
    #[cfg(target_os = "windows")]
    {
        let run_script = if cfg!(target_os = "windows") {
            "_up_/dist/backend/start.bat"
        } else {
            panic!("OS not supported")
        };

        let path = app
            .path()
            .resolve(run_script, tauri::path::BaseDirectory::Resource)
            .unwrap();

        Command::new(path)
            .creation_flags(CREATE_NO_WINDOW) // hide console window
            .spawn()
            .expect("failed to execute process");
    }
}

#[tauri::command]
fn stop_backend(app: &AppHandle) {
    #[cfg(target_os = "windows")]
    {
        let run_script = if cfg!(target_os = "windows") {
            "_up_/dist/backend/stop.bat"
        } else {
            panic!("OS not supported")
        };

        let path = app
            .path()
            .resolve(run_script, tauri::path::BaseDirectory::Resource)
            .unwrap();

        Command::new(path)
            .creation_flags(CREATE_NO_WINDOW) // hide console window
            .spawn()
            .expect("failed to execute process");
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(move |app| {
            start_backend(&app.app_handle());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![open_webcam_window])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(move |_app_handle, _event| match &_event {
            RunEvent::ExitRequested { .. } => {
                stop_backend(&_app_handle);
            }
            _ => (),
        });
}

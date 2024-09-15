use std::{os::windows::process::CommandExt, process::Command};

use tauri::{AppHandle, Manager, RunEvent};

// see https://learn.microsoft.com/en-us/windows/win32/procthread/process-creation-flags
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[tauri::command]
fn start_backend(app: &AppHandle) {
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

#[tauri::command]
fn stop_backend(app: &AppHandle) {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(move |app| {
            start_backend(&app.app_handle());

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(move |_app_handle, _event| match &_event {
            RunEvent::ExitRequested { .. } => {
                stop_backend(&_app_handle);
            }
            _ => (),
        });
}

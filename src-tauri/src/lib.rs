use std::sync::{Arc, Mutex};

use tauri::{path::BaseDirectory, AppHandle, Manager, RunEvent};
use tauri_plugin_shell::ShellExt;

#[tauri::command]
fn start_server(app: &AppHandle) {
    println!("Starting server");
    let resource_path = app
        .path()
        .resolve("_up_/.output/server/index.mjs", BaseDirectory::Resource);

    // // TODO: find resource_path with resolveResource
    // // let resPath = resolveResource("../.output/server/index.mjs").await;

    let sidecar_command = app
        .shell()
        .sidecar("droneviz-node")
        .unwrap()
        .arg(resource_path.unwrap());

    let (mut _rx, sidecar_child) = sidecar_command.spawn().expect("Failed to spawn cargo");

    // Wrap the child process in Arc<Mutex<>> for shared access
    let child = Arc::new(Mutex::new(Some(sidecar_child)));

    // Clone the Arc to move into the async task
    let child_clone = Arc::clone(&child);

    // auto kill the child process when the window is closed
    let window = app.get_webview_window("main").unwrap();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { .. } = event {
            println!("killing children");
            let mut child_lock = child_clone.lock().unwrap();
            if let Some(mut child_process) = child_lock.take() {
                if let Err(e) = child_process.write("Exit message from Rust\n".as_bytes()) {
                    println!("Fail to send to stdin of Python: {}", e);
                }

                if let Err(e) = child_process.kill() {
                    eprintln!("Failed to kill child process: {}", e);
                }

                // workaround to exit the process correctly (without zombie processs)
                std::process::exit(0);
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            start_server(app.app_handle());
            Ok(())
        })
        // .invoke_handler(tauri::generate_handler![open_webcam_window])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(move |_app_handle, event| match event {
            RunEvent::ExitRequested { .. } => {
                // TODO: doesn't work here - keeps the process running... workaround: call exit when closing child process
                std::process::exit(0);
            }
            _ => (),
        });
}

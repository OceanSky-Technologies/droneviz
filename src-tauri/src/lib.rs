use std::sync::{Arc, Mutex};

use tauri::{path::BaseDirectory, AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_shell::{process::CommandChild, ShellExt};

#[tauri::command]
fn start_server(app: &AppHandle) -> Arc<std::sync::Mutex<Option<CommandChild>>> {
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

    let (mut _rx, sidecar_child) = sidecar_command.spawn().expect("Failed to spawn sidecar");

    // Wrap the child process in Arc<Mutex<>> for shared access
    let child = Arc::new(Mutex::new(Some(sidecar_child)));

    let child_clone = Arc::clone(&child);

    return child_clone;
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let port = 3000;

    tauri::Builder::default()
        .plugin(tauri_plugin_localhost::Builder::new(port).build())
        .plugin(tauri_plugin_shell::init())
        .setup(move |app| {
            let child_clone = start_server(app.app_handle());

            let url = format!("http://127.0.0.1:{}", port).parse().unwrap();
            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url))
                .title("Droneviz - OceanSky Technologies")
                .resizable(true)
                .inner_size(1920.0, 1080.0)
                .build()?
                .on_window_event(move |event| {
                    // auto kill the child process when the window is closed
                    if let tauri::WindowEvent::CloseRequested { .. } = event {
                        println!("killing children");
                        let mut child_lock = child_clone.lock().unwrap();
                        if let Some(mut child_process) = child_lock.take() {
                            if let Err(e) =
                                child_process.write("Exit message from Rust\n".as_bytes())
                            {
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
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

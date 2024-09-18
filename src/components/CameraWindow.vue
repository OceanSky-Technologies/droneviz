<template>
  <div>
    <Button @click="openWebcamWindow">Open video</Button>
  </div>
</template>

<script lang="ts" setup>
import { invoke } from "@tauri-apps/api/core";
import Button from "primevue/button";

// Function to open webcam window
const openWebcamWindow = async (): Promise<void> => {
  try {
    // Detect if running in Tauri
    const isTauri = window.__TAURI__;
    if (isTauri) {
      // Call Tauri command to open a new window
      await invoke("open_webcam_window");
    } else {
      // Create a new window in the browser
      const newWindow: Window | null = window.open(
        "",
        "_blank",
        "width=640,height=480",
      );
      if (newWindow) {
        newWindow.document.write(`
          <html>
          <head>
            <style>
              body { margin: 0; padding: 0; overflow: hidden; }
              #controls { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.5); padding: 10px; z-index: 10; }
              #video { width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 1; }
            </style>
          </head>
          <body>
            <div id="controls">
              <label for="camera-select">Choose Camera:</label>
              <select id="camera-select"></select>
              <button id="start-button">Start Video</button>
            </div>
            <video id="video" autoplay playsinline></video>
          </body>
          </html>
        `);
        newWindow.document.close();

        // Add script to the new window
        const script = newWindow.document.createElement("script");
        script.textContent = `
          function populateCameraOptions(cameras) {
            const select = document.getElementById('camera-select');
            cameras.forEach(camera => {
              const option = document.createElement('option');
              option.value = camera.deviceId;
              option.textContent = camera.label || 'Camera ' + camera.deviceId;
              select.appendChild(option);
            });
          }

          document.getElementById('start-button').addEventListener('click', async () => {
            const select = document.getElementById('camera-select');
            const deviceId = select.value;
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId } });
              document.getElementById('video').srcObject = stream;
              document.getElementById('controls').style.display = 'none';
            } catch (err) {
              console.error('Error accessing camera:', err);
            }
          });

          navigator.mediaDevices.enumerateDevices().then(devices => {
            const cameras = devices.filter(device => device.kind === 'videoinput');
            populateCameraOptions(cameras);
          });
        `;
        newWindow.document.body.appendChild(script);
      } else {
        console.error("Failed to open a new window (popup might be blocked)");
      }
    }
  } catch (err) {
    console.error("Error opening webcam window:", err);
  }
};
</script>

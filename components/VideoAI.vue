<template>
  <div class="app-container">
    <div class="button-container">
      <select v-model="selectedDeviceId" @change="changeWebcam">
        <option
          v-for="device in videoDevices"
          :key="device.deviceId"
          :value="device.deviceId"
        >
          {{ device.label }}
        </option>
      </select>
      <div
        style="
          display: flex;
          direction: row;
          align-items: center;
          column-gap: 5px;
        "
      >
        <div>AI</div>
        <ToggleSwitch v-model="aiEnabled" />
      </div>
      <Button
        :icon="recordingIcon"
        @click="toggleRecording"
        :label="isRecording ? 'Stop Recording' : 'Start Recording'"
        iconPos="right"
        :severity="recordButtonSeverity"
      />
    </div>
    <div class="video-container">
      <!-- Video element (visible when AI is off) -->
      <video
        ref="webcam"
        autoplay
        muted
        v-show="!aiEnabled"
        class="video"
      ></video>
      <!-- Canvas element (visible when AI is on) -->
      <canvas ref="canvas" v-show="aiEnabled" class="video"></canvas>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { getFormattedDate } from "@/utils/DateUtils";
import { showToast, ToastSeverity } from "@/utils/ToastService";
import { Button } from "primevue";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const videoDevices = ref<MediaDeviceInfo[]>([]); // List of webcams
const selectedDeviceId = ref<string>(""); // Currently selected webcam

const webcam = ref<HTMLVideoElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const aiEnabled = ref(false);
const isRecording = ref(false);
let mediaRecorder: MediaRecorder | null = null;
let writableStream: FileSystemWritableFileStream | null = null;
let fileHandle: FileSystemFileHandle | null = null;
const recordingIcon = ref("");
const recordButtonSeverity = ref("");

let model: cocoSsd.ObjectDetection | null = null;

// List available video devices
const listVideoDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  videoDevices.value = devices.filter((device) => device.kind === "videoinput");

  // Set the first device as the default selected device
  if (videoDevices.value.length > 0 && !selectedDeviceId.value) {
    selectedDeviceId.value = videoDevices.value[0].deviceId;
  }
};

const startWebcam = async (deviceId: string | undefined = undefined) => {
  if (!webcam.value) return;

  const constraints: MediaStreamConstraints = {
    audio: false,
    video: deviceId
      ? {
          deviceId: { exact: deviceId },
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080 },
        }
      : {
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080 },
        },
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // Set video element source to webcam
  webcam.value.srcObject = stream;

  // Wait for video metadata to ensure correct video dimensions
  await new Promise((resolve) => {
    webcam.value!.onloadedmetadata = () => resolve(undefined);
  });

  const track = stream.getVideoTracks()[0];
  const { width, height } = track.getSettings();
  console.log(`Using resolution: ${width}x${height}`);

  setCanvasSize();

  // Play the video
  await webcam.value.play();
};

const stopWebcam = () => {
  const stream = (webcam.value?.srcObject as MediaStream) || null;
  stream?.getTracks().forEach((track) => track.stop());
};

// Change the currently active webcam
const changeWebcam = async () => {
  stopWebcam();
  await startWebcam(selectedDeviceId.value);
};

function setCanvasSize() {
  if (webcam.value && canvas.value) {
    const { videoWidth, videoHeight } = webcam.value;

    if (videoWidth && videoHeight) {
      const aspectRatio = videoWidth / videoHeight;

      // Get canvas container dimensions
      const container = canvas.value.parentElement;
      const containerWidth = container?.clientWidth || window.innerWidth;
      const containerHeight = container?.clientHeight || window.innerHeight;

      let width, height;

      // Fit within the container, maintaining aspect ratio
      if (containerWidth / containerHeight < aspectRatio) {
        // Container is taller relative to width
        width = containerWidth;
        height = containerWidth / aspectRatio;
      } else {
        // Container is wider relative to height
        height = containerHeight;
        width = containerHeight * aspectRatio;
      }

      // Apply calculated dimensions to the canvas
      canvas.value.width = videoWidth; // Intrinsic dimensions for drawing
      canvas.value.height = videoHeight;

      // Apply scaled dimensions for display
      canvas.value.style.width = `${width}px`;
      canvas.value.style.height = `${height}px`;
    }
  }
}

watch(aiEnabled, (newVal: boolean) => {
  if (newVal) {
    runAIWithFrameCallback(); // Start detection loop with frame callback
  } else {
    // Clear the canvas when stopping AI
    const ctx = canvas.value?.getContext("2d");
    if (canvas.value)
      ctx?.clearRect(0, 0, canvas.value.width, canvas.value.height);
  }
});

async function startRecording() {
  if (!webcam.value || !canvas.value) return;

  recordingIcon.value = "pi pi-spin pi-spinner";
  recordButtonSeverity.value = "danger";

  try {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: `video_${getFormattedDate()}.webm`,
      types: [
        {
          description: "WebM video file",
          accept: { "video/webm": [".webm"] },
        },
      ],
    });

    writableStream = await fileHandle!.createWritable();
    console.log(fileHandle);
    // Ensure the resolution matches the canvas resolution
    canvas.value.width = webcam.value.videoWidth;
    canvas.value.height = webcam.value.videoHeight;

    const stream = aiEnabled.value
      ? canvas.value.captureStream()
      : (webcam.value.srcObject as MediaStream);
    mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && writableStream) {
        await writableStream.write(event.data);
      }
    };

    mediaRecorder.start(1000); // Save chunks every 1 second
    isRecording.value = true;
  } catch (error) {
    console.error("Error initializing recording:", error);
    recordingIcon.value = "";
    recordButtonSeverity.value = "";
  }
}

const stopRecording = async () => {
  if (mediaRecorder) {
    mediaRecorder.stop();
    mediaRecorder = null;
  }

  if (writableStream) {
    await writableStream.close();
    writableStream = null;
  }

  isRecording.value = false;
  recordingIcon.value = "";
  recordButtonSeverity.value = "";

  if (fileHandle)
    showToast(`Video recoding saved:\n${fileHandle?.name}`, ToastSeverity.Info);
};

const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording();
  }
};

const handleResize = () => {
  setCanvasSize();
};

const runAIWithFrameCallback = () => {
  if (!webcam.value || !canvas.value || !model || !aiEnabled.value) return;

  const ctx = canvas.value.getContext("2d");
  if (!ctx) return;

  const processFrame = async () => {
    if (!webcam.value || !canvas.value || !model || !aiEnabled.value) return;

    if (webcam.value.readyState >= 2) {
      ctx.drawImage(
        webcam.value,
        0,
        0,
        canvas.value.width,
        canvas.value.height,
      );

      const predictions = await model.detect(webcam.value);

      predictions.forEach((prediction) => {
        const [x, y, width, height] = prediction.bbox;

        const scaleX = canvas.value!.width / webcam.value!.videoWidth;
        const scaleY = canvas.value!.height / webcam.value!.videoHeight;

        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);
        ctx.fillStyle = "red";
        ctx.font = "16px Tahoma";
        ctx.fillText(
          `${prediction.class} (${(prediction.score * 100).toFixed(1)}%)`,
          x * scaleX,
          y * scaleY > 20 ? y * scaleY - 10 : y * scaleY + 20,
        );
      });
    }

    if (aiEnabled.value && webcam.value?.requestVideoFrameCallback) {
      webcam.value.requestVideoFrameCallback(processFrame);
    }
  };

  if (webcam.value?.requestVideoFrameCallback) {
    webcam.value.requestVideoFrameCallback(processFrame);
  } else {
    const fallbackLoop = async () => {
      await processFrame();
      if (aiEnabled.value) requestAnimationFrame(fallbackLoop);
    };
    requestAnimationFrame(fallbackLoop);
  }
};

onMounted(async () => {
  await listVideoDevices();
  await startWebcam();
  model = await cocoSsd.load();
  setCanvasSize();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  stopWebcam();
  window.removeEventListener("resize", handleResize);
  stopRecording();
});
</script>

<style scoped lang="postcss">
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--p-content-background);
  border: 1px solid var(--p-content-border-color); /* Added solid border syntax */
}

.button-container {
  display: flex;
  flex-direction: row;
  text-align: center;
  justify-content: center;
  align-items: center;
  padding: 8px;
  column-gap: 15px;
}

.video-container {
  flex: 1;
  display: flex;
  align-content: start;
  width: 100%;
  overflow: hidden;
  display: block;
  margin: 0 auto;
}

.video {
  display: block;
  vertical-align: middle;
  margin: 0 auto;
  max-height: 100%;
}
</style>

<template>
  <div class="app-container">
    <div class="button-container">
      <Select
        v-model="selectedDevice"
        :options="videoDevices"
        option-label="label"
        placeholder="Select a video device"
        :disabled="isRecording"
        @change="changeVideoDevice"
        @focus="listVideoDevices"
        style="width: 300px"
      />

      <div
        style="
          display: flex;
          direction: row;
          align-items: center;
          column-gap: 5px;
        "
      >
        <div
          style="
            display: flex;
            flex-direction: row;
            gap: 5px;
            align-items: center;
          "
        >
          <MaterialSymbolsDetectionAndZone style="font-size: 1.4em" />
          AI
        </div>
        <ToggleSwitch
          v-model="aiEnabled"
          :disabled="isRecording || aiModelInitializing"
        />
      </div>
      <Button
        :icon="recordingIcon"
        @click="toggleRecording"
        :label="isRecording ? 'Stop Recording' : 'Start Recording'"
        iconPos="right"
        :severity="recordButtonSeverity"
      />

      <p>{{ videoInfo ? videoInfoToString(videoInfo) : "" }}</p>
    </div>
    <div class="video-container">
      <!-- Video element (visible when AI is off) -->
      <video
        ref="videoHtmlElement"
        autoplay
        muted
        v-show="!aiEnabled"
        class="video"
      ></video>
      <!-- canvas element (visible when AI is on) -->
      <canvas ref="canvasHtmlElement" v-show="aiEnabled" class="video"></canvas>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import MaterialSymbolsDetectionAndZone from "~icons/material-symbols/detection-and-zone";
import { getFormattedDate } from "@/utils/DateUtils";
import { showToast, ToastSeverity } from "@/utils/ToastService";
import { Button, ToggleSwitch, Select } from "primevue";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

interface DeviceInfo {
  label: string;
  deviceId: string;
  groupId: string;
  kind: string;
}

const videoDevices = ref<DeviceInfo[]>([]);
const selectedDevice = ref<DeviceInfo | null>(null);

interface VideoInfo {
  width?: number;
  height?: number;
  frameRate?: number;
}
const videoInfo = ref<VideoInfo | null>(null);

const videoHtmlElement = ref<HTMLVideoElement | null>(null);
const canvasHtmlElement = ref<HTMLCanvasElement | null>(null);
const aiEnabled = ref(false);
const aiModelInitializing = ref(true);
const isRecording = ref(false);
let mediaRecorder: MediaRecorder | null = null;
let writableStream: FileSystemWritableFileStream | null = null;
let fileHandle: FileSystemFileHandle | null = null;
const recordingIcon = ref("");
const recordButtonSeverity = ref("");

let model: cocoSsd.ObjectDetection | null = null;

const mediaConstraints: MediaStreamConstraints = {
  audio: false,
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
};

function videoInfoToString(info: VideoInfo) {
  return `${info.width}x${info.height} @ ${info.frameRate}fps`;
}

const listVideoDevices = async () => {
  if (videoDevices.value.length === 0) {
    videoDevices.value = [];

    videoDevices.value = [
      {
        label: "Loading ...",
        deviceId: "",
        groupId: "",
        kind: "",
      },
    ];
  }

  try {
    await navigator.mediaDevices.getUserMedia(mediaConstraints);
    const devices = await navigator.mediaDevices.enumerateDevices();
    videoDevices.value = [];

    for (const device of devices) {
      if (device.kind === "videoinput") {
        const videoDevice: DeviceInfo = {
          label: device.label || "Unknown device",
          deviceId: device.deviceId,
          groupId: device.groupId,
          kind: device.kind,
        };
        videoDevices.value.push(videoDevice);
        console.log("Found video device:", videoDevice);
      }
    }

    if (!selectedDevice.value && videoDevices.value.length > 0) {
      selectedDevice.value = videoDevices.value[0]; // Default device
    }
  } catch (error) {
    showToast("No video devices found.", ToastSeverity.Error);
    videoDevices.value = [
      {
        label: "No devices found",
        deviceId: "",
        groupId: "",
        kind: "videoinput",
      },
    ];
  }
};

const startVideo = async (device: DeviceInfo) => {
  if (!videoHtmlElement.value) {
    showToast("Can't open video: No video device found.", ToastSeverity.Error);
    return;
  }

  if (!device.deviceId || device.deviceId.length === 0) {
    showToast("Can't open video: Device ID unknown.", ToastSeverity.Error);
    return;
  }

  console.log("Starting video with device:", JSON.stringify(device));

  try {
    const constraintsWithDeviceId = {
      ...mediaConstraints,
      video: {
        ...(mediaConstraints.video as object),
        deviceId: { exact: device.deviceId },
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(
      constraintsWithDeviceId,
    );

    // Set video element source to videoHtmlElement
    videoHtmlElement.value.srcObject = stream;

    const track = stream.getVideoTracks()[0];

    console.log("Video track settings:", track.getSettings());
    console.log("Video track capabilities:", track.getCapabilities());

    // Play the video
    await videoHtmlElement.value.play();

    setCanvasSize();

    const { width, height, frameRate } = track.getSettings();
    videoInfo.value = { width, height, frameRate };

    // if AI was enabled before the video started, run the AI loop now
    if (aiEnabled.value) runAIWithFrameCallback();
  } catch (error) {
    showToast("Error starting video: " + error, ToastSeverity.Error);
  }
};

const stopVideo = () => {
  stopRecording();

  const stream = (videoHtmlElement.value?.srcObject as MediaStream) || null;
  stream?.getTracks().forEach((track) => track.stop());
  videoInfo.value = null;
};

const changeVideoDevice = async () => {
  if (!selectedDevice.value) return;

  stopVideo();

  await startVideo(selectedDevice.value);
};

function setCanvasSize() {
  if (videoHtmlElement.value && canvasHtmlElement.value) {
    const { videoWidth, videoHeight } = videoHtmlElement.value;

    if (videoWidth && videoHeight) {
      const aspectRatio = videoWidth / videoHeight;

      // Get canvasHtmlElement container dimensions
      const container = canvasHtmlElement.value.parentElement;
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

      // Apply calculated dimensions to the canvasHtmlElement
      canvasHtmlElement.value.width = videoWidth; // Intrinsic dimensions for drawing
      canvasHtmlElement.value.height = videoHeight;

      // Apply scaled dimensions for display
      canvasHtmlElement.value.style.width = `${width}px`;
      canvasHtmlElement.value.style.height = `${height}px`;
    }
  }
}

watch(aiEnabled, async (newVal: boolean) => {
  if (newVal) {
    runAIWithFrameCallback(); // Start detection loop with frame callback
  } else {
    // Clear the canvasHtmlElement when stopping AI
    const ctx = canvasHtmlElement.value?.getContext("2d");
    if (canvasHtmlElement.value)
      ctx?.clearRect(
        0,
        0,
        canvasHtmlElement.value.width,
        canvasHtmlElement.value.height,
      );
  }
});

async function startRecording() {
  if (!videoHtmlElement.value || !canvasHtmlElement.value) return;

  recordingIcon.value = "pi pi-spin pi-spinner";
  recordButtonSeverity.value = "danger";

  try {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: `video_${getFormattedDate()}`,
      types: [
        {
          description: "WebM video file",
          accept: { "video/webm": [".webm"] },
        },
        // mp4 doesn't work on Chrome as of today
        // {
        //   description: "MP4 video File",
        //   accept: { "video/mp4": [".mp4"] },
        // },
      ],
    });

    writableStream = await fileHandle!.createWritable();

    // Ensure the resolution matches the canvasHtmlElement resolution
    canvasHtmlElement.value.width = videoHtmlElement.value.videoWidth;
    canvasHtmlElement.value.height = videoHtmlElement.value.videoHeight;

    const stream = aiEnabled.value
      ? canvasHtmlElement.value.captureStream()
      : (videoHtmlElement.value.srcObject as MediaStream);

    const file = await fileHandle.getFile();

    // calculate the bitrate
    let bitrate = 4000000; // Default bitrate
    if (
      !videoInfo.value?.width ||
      !videoInfo.value?.height ||
      !videoInfo.value?.frameRate
    ) {
      showToast(
        "Video info not available. Using default bitrate: " +
          Math.trunc(bitrate / 1000000) +
          "Mbps.",
        ToastSeverity.Warn,
      );
    } else {
      const pixelsPerSecond =
        videoInfo.value.width *
        videoInfo.value.height *
        videoInfo.value.frameRate;

      const fileFormat = file.name.split(".").pop();

      let bitsPerPixel;

      if (fileFormat === "webm") {
        bitsPerPixel = 0.175; // good quality H.265
        bitrate = pixelsPerSecond * bitsPerPixel;
      } else if (fileFormat === "mp4" || fileFormat === "m4v") {
        bitsPerPixel = 0.25; // good quality H.264
        bitrate = pixelsPerSecond * bitsPerPixel;
      } else {
        showToast(
          "Unsupported file format. Using default bitrate: " +
            Math.trunc(bitrate / 1000000) +
            "Mbps.",
          ToastSeverity.Warn,
        );
      }
    }

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: file.type,
      videoBitsPerSecond: bitrate,
    });

    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && writableStream) {
        try {
          await writableStream.write(event.data);
        } catch (error) {
          // if the stream has been closed, skip the write
        }
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

  fileHandle = null;
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
  if (
    !videoHtmlElement.value ||
    !canvasHtmlElement.value ||
    !model ||
    !aiEnabled.value
  )
    return;

  const ctx = canvasHtmlElement.value.getContext("2d");
  if (!ctx) return;

  const processFrame = async () => {
    if (
      !videoHtmlElement.value ||
      !canvasHtmlElement.value ||
      !model ||
      !aiEnabled.value
    )
      return;

    if (videoHtmlElement.value.readyState >= 2) {
      ctx.drawImage(
        videoHtmlElement.value,
        0,
        0,
        canvasHtmlElement.value.width,
        canvasHtmlElement.value.height,
      );

      const predictions = await model.detect(videoHtmlElement.value);

      predictions.forEach((prediction) => {
        const [x, y, width, height] = prediction.bbox;

        const scaleX =
          canvasHtmlElement.value!.width / videoHtmlElement.value!.videoWidth;
        const scaleY =
          canvasHtmlElement.value!.height / videoHtmlElement.value!.videoHeight;

        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);
        ctx.fillStyle = "red";
        ctx.font = "3vh Tahoma";
        ctx.fillText(
          `${prediction.class} (${(prediction.score * 100).toFixed(1)}%)`,
          x * scaleX,
          y * scaleY > 20 ? y * scaleY - 10 : y * scaleY + 20,
        );
      });
    }

    if (aiEnabled.value && videoHtmlElement.value?.requestVideoFrameCallback) {
      videoHtmlElement.value.requestVideoFrameCallback(processFrame);
    }
  };

  if (videoHtmlElement.value?.requestVideoFrameCallback) {
    videoHtmlElement.value.requestVideoFrameCallback(processFrame);
  } else {
    const fallbackLoop = async () => {
      await processFrame();
      if (aiEnabled.value) requestAnimationFrame(fallbackLoop);
    };
    requestAnimationFrame(fallbackLoop);
  }
};

onMounted(async () => {
  window.addEventListener("resize", handleResize);

  listVideoDevices().then(() => {
    if (selectedDevice.value) startVideo(selectedDevice.value);
  });

  cocoSsd.load().then((loadedModel) => {
    model = loadedModel;
    aiModelInitializing.value = false;
  });
});

onBeforeUnmount(() => {
  stopRecording();
  stopVideo();
  window.removeEventListener("resize", handleResize);
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
  text-align: center;
  justify-content: center;
  align-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: block;
  margin: 0 auto;
}

.video {
  align-self: center;
  display: block;
  margin: 0 auto;
  height: 100%;
}
</style>

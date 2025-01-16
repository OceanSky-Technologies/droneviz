<!-- A button that shows a progress bar when clicked and emits a click event when the progress bar is filled. -->

<script lang="ts" setup>
import { ref, computed, onUnmounted } from "vue";
import { Button } from "primevue";
import { AnimationFrameScheduler } from "~/utils/AnimationFrameScheduler";

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  time: {
    type: Number,
    default: 1, // seconds
  },
});

// Emit click event
const emit = defineEmits(["click"]);

// Progress tracking
const progress = ref<number>(0);
const isHolding = ref<boolean>(false);

// Animation frame scheduler: used to update the progress bar smoothly
let animationStartTime: number;
const animationFrameScheduler = new AnimationFrameScheduler(async () => {
  if (progress.value < 100) {
    progress.value = Math.min(
      100,
      ((performance.now() - animationStartTime) / (props.time * 1000)) * 100,
    );
  } else {
    stopProgress();
    emit("click"); // Emit the click event
  }
});

// Dynamic gradient background
const backgroundStyle = computed(() => {
  return `linear-gradient(to right, var(--color-gold) ${progress.value}%, var(--color-dark-blue) ${progress.value}%)`;
});

// Start the progress bar
const startProgress = (): void => {
  isHolding.value = true;
  progress.value = 0;

  animationStartTime = performance.now();
  animationFrameScheduler.start();
};

// Reset progress
const resetProgress = (): void => {
  stopProgress();
  progress.value = 0;
};

// Stop the progress bar
const stopProgress = (): void => {
  animationFrameScheduler.stop();
  isHolding.value = false;
};

onUnmounted(() => {
  stopProgress();
});
</script>

<template>
  <div class="button-container">
    <Button
      :label="label"
      class="progress-button"
      :style="{ background: backgroundStyle }"
      @mousedown="startProgress"
      @mouseup="resetProgress"
      @mouseleave="resetProgress"
    >
      <template #default>
        <div class="button-content">
          <slot name="icon" />
          <span>{{ label }}</span>
        </div>
      </template>
    </Button>
  </div>
</template>

<style scoped lang="postcss">
.button-container {
  display: inline-block;
  position: relative;
}

.progress-button {
  position: relative;
  display: inline-flex;
  border: none !important;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  transition: background 50ms linear;
}

.button-content {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: white; /* Ensure text is visible */
  z-index: 1;
}

.p-button {
  position: relative; /* Ensure proper layout */
}
</style>

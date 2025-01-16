<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";
import Button from "primevue/button";

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  disableMouseLeave: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["click"]);

const isConfirming = ref(false);
const containerRef = ref<HTMLElement | null>(null);

// Handlers
const handleClick = (): void => {
  if (isConfirming.value) {
    // Perform the action and reset
    emit("click");
    isConfirming.value = false;
  } else {
    // Switch to confirmation state
    isConfirming.value = true;
  }
};

const handleCancel = (): void => {
  isConfirming.value = false;
};

const handleOutsideClick = (event: MouseEvent): void => {
  // If we don't have a container, do nothing
  if (!containerRef.value) return;

  // 1) If the click is inside this button container, do nothing
  if (containerRef.value.contains(event.target as Node)) {
    return;
  }

  // 2) If the click/drag is inside the Cesium container, do nothing
  //    (Replace '#cesiumContainer' with the actual ID or class you have for Cesium)
  const cesiumContainer = document.getElementById("cesiumContainer");
  if (cesiumContainer && cesiumContainer.contains(event.target as Node)) {
    return;
  }

  // Otherwise, handle cancel
  handleCancel();
};

onMounted(() => {
  document.addEventListener("click", handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener("click", handleOutsideClick);
});
</script>

<template>
  <!-- Use ref to tie this container to containerRef -->
  <div ref="containerRef" class="button-container">
    <Button
      :label="isConfirming ? 'Confirm' : label"
      :severity="isConfirming ? 'warn' : 'primary'"
      class="confirmation-button"
      @click="handleClick"
      @mouseleave="!disableMouseLeave && handleCancel"
    >
      <template #default>
        <div class="button-content">
          <slot name="icon" />
          <span>{{ isConfirming ? "Confirm" : label }}</span>
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

.confirmation-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.button-content {
  display: flex;
  min-width: 75px !important;
  align-items: center;
  align-content: center;
  justify-content: center;
  gap: 0.3rem;
  z-index: 1;
}
</style>

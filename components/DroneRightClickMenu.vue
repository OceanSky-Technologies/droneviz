<script lang="ts" setup>
import { onMounted } from "vue";
import { eventBus } from "~/utils/Eventbus";
const visible = ref(false);

function flyTo() {
  console.log("Fly to clicked");
  closeMenu();
}

const position = ref({ x: 0, y: 0 });

import type { CSSProperties } from "vue";
import type { Entity } from "cesium";

const popupStyle = computed<CSSProperties>(() => ({
  top: `${position.value.y}px`,
  left: `${position.value.x}px`,
}));

function showMenu(coords: { x: number; y: number }) {
  position.value = coords;
  visible.value = true;
}

const closeMenu = () => {
  visible.value = false;
};

function handleCesiumRightClick({
  entity,
  position,
}: {
  entity: Entity | undefined;
  position: { x: number; y: number };
}) {
  if (!entity) {
    showMenu({ x: position.x, y: position.y });
  } else {
    closeMenu();
  }
}

onMounted(() => {
  eventBus.on("cesiumRightClick", handleCesiumRightClick);
  eventBus.on("cesiumLeftClick", closeMenu);
  eventBus.on("cesiumCameraMoveStart", closeMenu);

  eventBus.on("droneDisconnected", closeMenu);
  eventBus.on("allDronesDisconnected", closeMenu);
});

onBeforeUnmount(() => {
  eventBus.off("cesiumRightClick", handleCesiumRightClick);
  eventBus.off("cesiumLeftClick", closeMenu);
  eventBus.off("cesiumCameraMoveStart", closeMenu);

  eventBus.off("droneDisconnected", closeMenu);
  eventBus.off("allDronesDisconnected", closeMenu);
});
</script>

<template>
  <div
    v-if="visible"
    :style="popupStyle"
    class="popup-menu bg-white dark:bg-black"
    @click.self="closeMenu"
  >
    <Button label="Fly to" @click="flyTo" />
  </div>
</template>

<style scoped lang="postcss">
.popup-menu {
  position: absolute;
  border-radius: 5px;
  padding: 10px;
  z-index: 1000;
}
</style>

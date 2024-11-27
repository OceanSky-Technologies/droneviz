<script lang="ts" setup>
import { onMounted } from "vue";
import { eventBus } from "~/utils/Eventbus";
const visible = ref(false);

function flyTo() {
  console.log("Fly to clicked");
  hide();
}

const position = ref({ x: 0, y: 0 });

import type { CSSProperties } from "vue";
import type { Entity } from "cesium";

const popupStyle = computed<CSSProperties>(() => ({
  top: `${position.value.y}px`,
  left: `${position.value.x}px`,
}));

function show(coords: { x: number; y: number }) {
  position.value = coords;
  visible.value = true;
}

const hide = () => {
  visible.value = false;
};

function handleCesiumRightClick({
  entity,
  position,
}: {
  entity: Entity | undefined;
  position: { x: number; y: number };
}) {
  if (entity) {
    show({ x: position.x, y: position.y });
  } else {
    hide();
  }
}

onMounted(() => {
  eventBus.on("cesiumRightClick", handleCesiumRightClick);
  eventBus.on("cesiumLeftClick", hide);
  eventBus.on("cesiumCameraMoveStart", hide);
});

onBeforeUnmount(() => {
  eventBus.off("cesiumRightClick", handleCesiumRightClick);
  eventBus.off("cesiumLeftClick", hide);
  eventBus.off("cesiumCameraMoveStart", hide);
});
</script>

<template>
  <div
    v-if="visible"
    :style="popupStyle"
    class="popup-menu bg-white dark:bg-black"
    @click.self="hide"
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

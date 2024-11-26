<script lang="ts" setup>
import { onMounted } from "vue";
import { eventBus } from "~/utils/Eventbus";
import { Menu } from "primevue";

const menuRef = useTemplateRef<InstanceType<typeof Menu>>("menu");
const visible = ref(false); // Visibility state of the menu

// Define the menu items
const menuItems = [
  {
    label: "Fly to",
    command: () => {
      console.log("Option 1 selected");
    },
  },
];

const onHide = () => {
  visible.value = false; // Reset visibility on menu hide
};

onMounted(() => {
  eventBus.on("cesiumRightClick", ({ entity, position }) => {
    if (!menuRef.value) {
      console.error("Menu reference not found");
      return;
    }

    console.log("Right click event received");
    console.log(entity);
    console.log(position);
    if (entity) {
      const mouseEvent = {
        pageX: position.x,
        pageY: position.y,
        preventDefault: () => {}, // Stub method for compatibility
      } as MouseEvent;

      menuRef.value.show(mouseEvent);
      visible.value = true;
    } else {
      console.log("hide");
      menuRef.value.hide();
      visible.value = false;
    }
  });

  eventBus.on("cesiumLeftClick", () => {
    if (!menuRef.value) {
      console.error("Menu reference not found");
      return;
    }

    console.log("hide");
    menuRef.value.hide();
    visible.value = false;
  });
});
</script>

<template>
  <div>
    <Menu ref="menu" :model="menuItems" v-show="visible" @hide="onHide" />
  </div>
</template>

<style scoped lang="postcss"></style>

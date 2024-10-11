<script lang="ts" setup>
import Toolbar from "primevue/toolbar";
import CascadeSelect from "primevue/cascadeselect";
import ToggleSwitch from "primevue/toggleswitch";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import InputText from "primevue/inputtext";
import { ref, watch } from "vue";

// react on 3D toggle changes
const map3DEnabled = ref(true);
watch(
  () => map3DEnabled.value,
  (newVal: boolean) => {
    console.log(newVal);
  },
);

// react on map data source changes
interface MapDataSource {
  name: string;
  shortName: string;
  code: string;
  image: string;
  options?: MapDataSource[];
}

const tmp = new URL("@/assets/images/google-maps.png", import.meta.url).href;
const mapDataSources: MapDataSource[] = [
  {
    name: "Google 3D Tiles",
    shortName: "Google 3D Tiles",
    code: "google3dtiles",
    image: tmp,
  },
  {
    name: "OpenStreetMap",
    shortName: "OpenStreetMap",
    code: "openstreetmap",
    image: tmp,
  },
  {
    name: "Bing Maps",
    shortName: "Bing Maps",
    code: "bing",
    image: tmp,
    options: [
      {
        shortName: "Aerial",
        name: "Bing Aerial",
        code: "bing-aerial",
        image: tmp,
      },
      {
        shortName: "Road",
        name: "Bing Road",
        code: "bing-road",
        image: tmp,
      },
    ],
  },
  {
    name: "ArcGIS",
    shortName: "ArcGIS",
    code: "arcgis",
    image: tmp,
  },
];
const mapDataSource = ref(mapDataSources[0] as MapDataSource);

watch(
  () => mapDataSource.value,
  (newVal: MapDataSource) => {
    if (newVal) console.log(newVal.code);
  },
);
</script>

<template>
  <Toolbar
    class="main-toolbar absolute bottom-0 left-0 right-0 top-0 z-10 mx-auto flex h-min w-fit items-center justify-center shadow-lg"
    style="border-top-left-radius: 0%; border-top-right-radius: 0%"
  >
    <template #start>
      <div>3D</div>
      <ToggleSwitch v-model="map3DEnabled" />
    </template>

    <template #center>
      <IconField icon-position="left">
        <InputIcon>
          <i class="pi pi-search" />
        </InputIcon>
        <InputText placeholder="Search" />
      </IconField>
    </template>

    <template #end>
      <CascadeSelect
        v-model="mapDataSource"
        :options="mapDataSources"
        option-label="name"
        option-group-label="name"
        :option-group-children="['options']"
        style="min-width: 14rem"
        placeholder="Select a data source"
      >
        <template #option="slotProps">
          <div class="flex items-center">
            <img :src="`${slotProps.option.image}`" style="width: 18px" />
            <span>{{
              slotProps.option.optionName || slotProps.option.shortName
            }}</span>
          </div>
        </template>
      </CascadeSelect>
    </template>
  </Toolbar>
</template>

<style scoped lang="postcss">
.main-toolbar {
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
  border-top: 0 !important;
}
:deep(.p-toolbar-start) {
  column-gap: 7px !important;
}
</style>

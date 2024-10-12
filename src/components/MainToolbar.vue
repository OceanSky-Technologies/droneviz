<script lang="ts" setup>
import Toolbar from "primevue/toolbar";
import CascadeSelect from "primevue/cascadeselect";
import ToggleSwitch from "primevue/toggleswitch";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import InputText from "primevue/inputtext";
import { onMounted, Ref, ref, watch } from "vue";
import { settings } from "./Settings";
import {
  disableGoogleTiles,
  enableGoogleTiles,
  getCesiumViewer,
  getGoogle3DTileset,
} from "./CesiumViewerWrapper";
import { Cesium3DTileset, ProviderViewModel, SceneMode } from "cesium";
import NodeGeocoder from "node-geocoder";

// list of all available map data sources
let mapDataSources: Ref<MapDataSource[]> = ref([
  { name: "", shortName: "", code: "", image: "" },
]);

// selected map data source
const mapDataSourceSelection: Ref<MapDataSource | null> = ref(null);

// 3d mode enabled flag
const map3DEnabled = ref(true);

// search string
const searchString = ref("");

const options = {
  provider: "openstreetmap" as const,
};

const geocoder = NodeGeocoder(options);
const searchIconClass = ref("pi pi-search"); // default class

watch(
  () => map3DEnabled.value,
  (newVal: boolean) => {
    getCesiumViewer().scene.mode = newVal
      ? SceneMode.SCENE3D
      : SceneMode.SCENE2D;
  },
);

watch(
  () => mapDataSourceSelection.value,
  (newVal: MapDataSource | null) => {
    if (newVal) {
      if (newVal.tileset) {
        if (settings.google3DTilesEnabled.value) enableGoogleTiles();
      } else if (newVal.viewModel) {
        if (settings.google3DTilesEnabled.value) disableGoogleTiles();

        // show the selected imagery provider
        getCesiumViewer().baseLayerPicker.viewModel.selectedImagery =
          newVal.viewModel as ProviderViewModel;
      }
    }
  },
);

/**
 * Perform a search based on the search string using the geocoder.
 */
async function doSearch() {
  if (searchString.value.trim() === "") return;

  searchIconClass.value = "pi pi-spin pi-spinner";

  const res = await geocoder.geocode(searchString.value);

  console.log(res);

  searchIconClass.value = "pi pi-search";
}

// react on map data source changes
interface MapDataSource {
  name: string;
  shortName: string;
  code: string;
  image: string;
  tileset?: Cesium3DTileset | undefined; // tileset has priority
  viewModel?: ProviderViewModel | undefined;
  options?: MapDataSource[];
}

/**
 * Initialize the map data sources from a given viewer.
 * @returns {MapDataSource[]} The map data sources.
 */
async function initMapDataSources(): Promise<MapDataSource[]> {
  let result: MapDataSource[] = [];

  // Google 3D tiles are not part of the baseLayerPicker so add it now
  if (settings.google3DTilesEnabled.value) {
    try {
      result.push({
        name: "Google 3D Tiles",
        shortName: "Google 3D Tiles",
        code: "google3dtiles",
        image: new URL("@/assets/images/google-maps.png", import.meta.url).href,
        tileset: getGoogle3DTileset() as Cesium3DTileset,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error("An unknown error occurred: " + error);
      }
    }
  }

  for (const provider of getCesiumViewer().baseLayerPicker.viewModel
    .imageryProviderViewModels) {
    if (provider.name === "Bing Maps Aerial") {
      result.push({
        name: "Bing Maps",
        shortName: "Bing Maps",
        code: "bing",
        image: new URL("@/assets/images/bing.png", import.meta.url).href,
        options: [
          {
            shortName: "Satellite",
            name: "Bing Satellite",
            code: "bing-satellite",
            image: new URL(
              "@/assets/images/bing-satellite.png",
              import.meta.url,
            ).href,
            viewModel:
              getCesiumViewer().baseLayerPicker.viewModel.imageryProviderViewModels.find(
                (provider) => provider.name === "Bing Maps Aerial",
              ),
          },
          {
            shortName: "Road",
            name: "Bing Road",
            code: "bing-road",
            image: new URL("@/assets/images/bing-road.png", import.meta.url)
              .href,
            viewModel:
              getCesiumViewer().baseLayerPicker.viewModel.imageryProviderViewModels.find(
                (provider) => provider.name === "Bing Maps Roads",
              ),
          },
        ],
      });
    } else if (provider.name.indexOf("Bing") !== -1) {
      // skip all other bing providers as these have already been added
    } else if (provider.name === "ArcGIS World Imagery") {
      result.push({
        name: "ArcGIS",
        shortName: "ArcGIS",
        code: "arcgis",
        image: new URL("@/assets/images/arcgis.png", import.meta.url).href,
        options: [
          {
            shortName: "World Imagery",
            name: "ArcGIS World Imagery",
            code: "arcgis-world-imagery",
            image: new URL(
              "@/assets/images/arcgis-imagery.png",
              import.meta.url,
            ).href,
            viewModel:
              getCesiumViewer().baseLayerPicker.viewModel.imageryProviderViewModels.find(
                (provider) => provider.name === "ArcGIS World Imagery",
              ),
          },
          {
            shortName: "World Hillshade",
            name: "ArcGIS World Hillshade",
            code: "arcgis-world-hillshade",
            image: new URL(
              "@/assets/images/arcgis-hillshade.png",
              import.meta.url,
            ).href,

            viewModel:
              getCesiumViewer().baseLayerPicker.viewModel.imageryProviderViewModels.find(
                (provider) => provider.name === "ArcGIS World Hillshade",
              ),
          },
          {
            shortName: "World Ocean",
            name: "ArcGIS World Ocean",
            code: "arcgis-world-ocean",
            image: new URL("@/assets/images/arcgis-ocean.png", import.meta.url)
              .href,

            viewModel:
              getCesiumViewer().baseLayerPicker.viewModel.imageryProviderViewModels.find(
                (provider) => provider.name === "ArcGIS World Ocean",
              ),
          },
        ],
      });
    } else if (provider.name.indexOf("ArcGIS") !== -1) {
      // skip all other ArcGIS providers as these have already been added
    } else if (provider.name === "OpenStreetMap") {
      result.push({
        name: "OpenStreetMap",
        shortName: "OpenStreetMap",
        code: "openstreetmap",
        image: new URL("@/assets/images/openstreetmap.png", import.meta.url)
          .href,
        viewModel: provider,
      });
    } else if (provider.name === "Stadia x Stamen Watercolor") {
      result.push({
        name: "Stadia x Stamen Watercolor",
        shortName: "Stadia x Stamen Watercolor",
        code: "stadia-watercolor",
        image: new URL("@/assets/images/stamen-watercolor.png", import.meta.url)
          .href,
        viewModel: provider,
      });
    } else if (provider.name.indexOf("Stadia") !== -1) {
      // skip all other Stadia providers as these have already been added
    } else if (provider.name === "Sentinel-2") {
      result.push({
        name: "Sentinel-2",
        shortName: "Sentinel-2",
        code: "sentinel2",
        image: new URL("@/assets/images/sentinel-2.png", import.meta.url).href,
        viewModel: provider,
      });
    } else {
      result.push({
        name: provider.name,
        shortName: provider.name,
        code: provider.name.toLowerCase().replace(" ", ""),
        image: provider.iconUrl,
        viewModel: provider,
      });
    }
  }

  // calculate length of all options
  let resultLength = 0;
  for (let resultElement of result) {
    if (resultElement.options) {
      resultLength += resultElement.options.length;
    } else {
      resultLength++;
    }
  }

  // make sure the toolbar has all the data sources
  let expectedLength =
    getCesiumViewer().baseLayerPicker.viewModel.imageryProviderViewModels
      .length;

  if (settings.google3DTilesEnabled.value) expectedLength++; // +1 is for Google 3D Tiles

  if (resultLength !== expectedLength)
    throw Error("Not all map data sources are added");

  return result;
}

onMounted(async () => {
  try {
    mapDataSources.value = await initMapDataSources();

    // update the selection
    mapDataSourceSelection.value = mapDataSources.value[0] as MapDataSource;
  } catch (e) {
    if (e instanceof Error) {
      console.error("Error initializing toolbar", e.message);
      console.error(e.stack);
    }
  }
});
</script>

<template>
  <Toolbar
    class="main-toolbar absolute bottom-0 left-0 right-0 top-0 z-10 mx-auto flex h-min w-fit items-center justify-center shadow-lg"
    style="border-top-left-radius: 0%; border-top-right-radius: 0%"
  >
    <template #start>
      <div>3D</div>
      <ToggleSwitch id="3d-toggle-switch" v-model="map3DEnabled" />
    </template>

    <template #center>
      <IconField icon-position="left">
        <InputIcon>
          <i :class="searchIconClass" />
        </InputIcon>
        <InputText
          v-model="searchString"
          placeholder="Search"
          @keyup.enter="doSearch"
        />
      </IconField>
    </template>

    <template #end>
      <CascadeSelect
        v-model="mapDataSourceSelection"
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

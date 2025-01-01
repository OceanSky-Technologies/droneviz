<script lang="ts" setup>
import Toolbar from "primevue/toolbar";
import CascadeSelect from "primevue/cascadeselect";
import ToggleSwitch from "primevue/toggleswitch";
import InputText from "primevue/inputtext";
import Listbox from "primevue/listbox";

import { onMounted, type Ref, ref, watch } from "vue";
import { settings } from "../utils/Settings";
import {
  disableGoogleTiles,
  enableGoogleTiles,
  getCesiumViewer,
  getGoogle3DTileset,
} from "./CesiumViewerWrapper";
import type { Cesium3DTileset, ProviderViewModel } from "cesium";
import { Cartesian3, SceneMode } from "cesium";
import { showToast, ToastSeverity } from "@/utils/ToastService";
import type { ComponentPublicInstance } from "vue";

// list of all available map data sources
const mapDataSources: Ref<MapDataSource[]> = ref([
  { name: "", shortName: "", code: "", image: "" },
]);

// selected map data source
const mapDataSourceSelection: Ref<MapDataSource | null> = ref(null);

// 3d mode enabled flag
const map3DEnabled = ref(true);

// search string
const searchString = ref("");

// search icon class
const searchIconClass = ref("pi pi-search");

// geolocation search results
interface GeoLocationResult {
  text: string;
  lat: number;
  lon: number;
}
// list of geolocation search results
const geolocationOptions: GeoLocationResult[] = [];

// reference to the search input field
const searchBoxRef = useTemplateRef<ComponentPublicInstance>("searchBox");

// reference to the listbox
const geolocationListboxRef =
  useTemplateRef<ComponentPublicInstance>("geolocationListbox");

// Control visibility of the Listbox
const showGeolocationListbox = ref(false);

// Selected geolocation
const selectedGeolocation = ref<GeoLocationResult | null>(null);

// when a geolocation was selected then hide the geolocationListbox and fly to the selected location
watch(
  () => selectedGeolocation.value,
  (newVal: GeoLocationResult | null) => {
    if (newVal) {
      showGeolocationListbox.value = false;

      // fly to the selected location
      getCesiumViewer().camera.flyTo({
        destination: Cartesian3.fromDegrees(newVal.lon, newVal.lat, 10000),
        duration: 3,
      });

      // clear the list
      geolocationOptions.splice(0, geolocationOptions.length);

      showGeolocationListbox.value = false;
      searchString.value = "";
    }
  },
);

watch(map3DEnabled, (newVal: boolean) => {
  getCesiumViewer().scene.mode = newVal ? SceneMode.SCENE3D : SceneMode.SCENE2D;
});

function changeMapDataSource() {
  if (mapDataSourceSelection.value) {
    if (mapDataSourceSelection.value.tileset) {
      if (settings.google3DTilesEnabled.value) enableGoogleTiles();
    } else if (mapDataSourceSelection.value.viewModel) {
      if (settings.google3DTilesEnabled.value) disableGoogleTiles();

      // show the selected imagery provider
      getCesiumViewer().baseLayerPicker.viewModel.selectedImagery =
        mapDataSourceSelection.value.viewModel as ProviderViewModel;
    }
  }
}

/**
 * Position the geolocation results listbox under the search input field.
 */
function positionListbox() {
  if (!searchBoxRef.value || !searchBoxRef.value.$el) {
    console.error("Couldn't find the searchBox");
    return;
  }
  if (!geolocationListboxRef.value || !geolocationListboxRef.value.$el) {
    console.error("Couldn't find the geolocationListbox");
    return;
  }

  try {
    const inputElement = searchBoxRef.value.$el;
    const inputRect = inputElement.getBoundingClientRect();
    const listboxElement = geolocationListboxRef.value.$el;

    // Set the position based on the input's bounding rectangle
    listboxElement.style.width = `${inputRect.width}px`;
    listboxElement.style.top = `${inputRect.bottom}px`;
    listboxElement.style.left = `${inputElement.style.left}px`;
  } catch (e) {
    console.error("Error positioning listbox", e);
  }
}

/**
 * Perform a search based on the search string using the geocoder.
 */
async function doSearch() {
  const searchStringSanitized = searchString.value.trim();
  if (searchStringSanitized === "") return;

  searchIconClass.value = "pi pi-spin pi-spinner";

  try {
    const config = useRuntimeConfig();

    const data = await $fetch("/api/geocoder", {
      params: { text: searchStringSanitized },
      baseURL: config.public.baseURL as string,
    });

    // clear the list
    geolocationOptions.splice(0, geolocationOptions.length);

    if (data.length === 0) {
      showToast(
        `No geolocation results found for: ${searchStringSanitized}`,
        ToastSeverity.Info,
      );
      searchIconClass.value = "pi pi-search";
      return;
    }

    // only one result -> fly to it
    if (data.length === 1 && data[0].latitude && data[0].longitude) {
      // fly to the selected location
      getCesiumViewer().camera.flyTo({
        destination: Cartesian3.fromDegrees(
          data[0].longitude,
          data[0].latitude,
          10000,
        ),
        duration: 3,
      });

      searchString.value = "";
      searchIconClass.value = "pi pi-search";

      // remove foxus from the search input field
      (document.activeElement as HTMLElement)?.blur();
      return;
    }

    // add all elements to the list
    for (const geolocation of data) {
      if (
        geolocation.formattedAddress &&
        geolocation.latitude &&
        geolocation.longitude
      ) {
        geolocationOptions.push({
          text: geolocation.formattedAddress,
          lat: geolocation.latitude,
          lon: geolocation.longitude,
        });
      }
    }

    // position the listbox under the input field (do it dynamically as the input field might have moved when resizing the window)
    positionListbox();

    // hide the listbox and show it again to force a re-render in case the listbox is already visible
    showGeolocationListbox.value = false;
    showGeolocationListbox.value = true;
  } catch (e) {
    showToast(
      `Couldn't find geolocation results: ${JSON.stringify(e)}`,
      ToastSeverity.Error,
    );
  }

  searchIconClass.value = "pi pi-search";
}

/**
 * Close the search listbox.
 */
function closeSearchListbox() {
  // clear the list
  geolocationOptions.splice(0, geolocationOptions.length);
  showGeolocationListbox.value = false;
  searchString.value = "";
  searchIconClass.value = "pi pi-search";

  // remove foxus from the search input field
  (document.activeElement as HTMLElement)?.blur();
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
  const result: MapDataSource[] = [];

  // Google 3D tiles are not part of the baseLayerPicker so add it now
  if (settings.google3DTilesEnabled.value) {
    try {
      result.push({
        name: "Google 3D Tiles",
        shortName: "Google 3D Tiles",
        code: "google3dtiles",
        image: new URL("assets/images/google-maps.png", import.meta.url).href,
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
        image: new URL("assets/images/bing.png", import.meta.url).href,
        options: [
          {
            shortName: "Satellite",
            name: "Bing Satellite",
            code: "bing-satellite",
            image: new URL("assets/images/bing-satellite.png", import.meta.url)
              .href,
            viewModel:
              getCesiumViewer().baseLayerPicker.viewModel.imageryProviderViewModels.find(
                (provider) => provider.name === "Bing Maps Aerial",
              ),
          },
          {
            shortName: "Road",
            name: "Bing Road",
            code: "bing-road",
            image: new URL("assets/images/bing-road.png", import.meta.url).href,
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
        image: new URL("assets/images/arcgis.png", import.meta.url).href,
        options: [
          {
            shortName: "World Imagery",
            name: "ArcGIS World Imagery",
            code: "arcgis-world-imagery",
            image: new URL("assets/images/arcgis-imagery.png", import.meta.url)
              .href,
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
              "assets/images/arcgis-hillshade.png",
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
            image: new URL("assets/images/arcgis-ocean.png", import.meta.url)
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
        image: new URL("assets/images/openstreetmap.png", import.meta.url).href,
        viewModel: provider,
      });
    } else if (provider.name === "Stadia x Stamen Watercolor") {
      result.push({
        name: "Stadia x Stamen Watercolor",
        shortName: "Stadia x Stamen Watercolor",
        code: "stadia-watercolor",
        image: new URL("assets/images/stamen-watercolor.png", import.meta.url)
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
        image: new URL("assets/images/sentinel-2.png", import.meta.url).href,
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
  for (const resultElement of result) {
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
  <div>
    <Toolbar class="main-toolbar">
      <template #start>
        <div>3D</div>
        <ToggleSwitch id="3d-toggle-switch" v-model="map3DEnabled" />
      </template>

      <template #center>
        <InputGroup ref="searchBox" style="width: 18rem">
          <Button :icon="searchIconClass" severity="info" @click="doSearch" />

          <FloatLabel variant="on">
            <InputText
              v-model="searchString"
              @keyup.enter="doSearch"
              @keyup.escape="closeSearchListbox"
            />
            <label for="on_label" style="font-weight: normal">Search</label>
          </FloatLabel>
          <Button
            icon="pi pi-times"
            severity="danger"
            @click="closeSearchListbox"
          />
        </InputGroup>
        <Listbox
          v-show="showGeolocationListbox"
          ref="geolocationListbox"
          v-model="selectedGeolocation"
          :options="geolocationOptions"
          option-label="text"
          class="floating-listbox"
          style="position: absolute"
        />
      </template>

      <template #end>
        <FloatLabel variant="on">
          <CascadeSelect
            v-model="mapDataSourceSelection"
            :options="mapDataSources"
            option-label="name"
            option-group-label="name"
            :option-group-children="['options']"
            style="width: 15rem"
            placeholder="Select a data source"
            @change="changeMapDataSource"
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
          <label for="on_label" style="font-weight: normal">Map provider</label>
        </FloatLabel>
      </template>
    </Toolbar>
  </div>
</template>

<style scoped lang="postcss">
.main-toolbar {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: 10;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  border-top: 0;
  padding: 8px;
  column-gap: 15px;
  flex-wrap: nowrap;
}

:deep(.p-toolbar-start) {
  column-gap: 7px !important;
}

.floating-listbox {
  position: absolute;
  z-index: 1000; /* Ensure it floats above other elements */
}
</style>

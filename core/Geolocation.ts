import * as Cesium from "cesium";
import { getCesiumViewer } from "@/components/CesiumViewerWrapper";
import { Colors } from "@/utils/Colors";
import { getHeight } from "@/utils/CoordinateUtils";
import { type Ref, ref } from "vue";

let lastGeoPosition: GeolocationPosition | undefined = undefined;

export const geolocation: Ref<Cesium.Cartesian3 | undefined> = ref(undefined);

export let lastPosition: GeolocationPosition | null = null;

const options = {
  enableHighAccuracy: true,
  timeout: 30000,
  maximumAge: 30000,
};

/**
 * Returns a promise to the browser geolocation.
 */
export function getGeolocationAsync(): Promise<GeolocationPosition> {
  if (!navigator.geolocation) {
    throw new Error("Geolocation not supported");
  }

  return new Promise((resolve, reject) => {
    if (lastPosition) return resolve(lastPosition);

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        console.log("Position fetched:", position);
        lastPosition = position;

        resolve(position);
      },
      (error: GeolocationPositionError) => {
        const errorMessage =
          "Couldn't get your location. Please enable location services and make sure you're connected to the internet. Error: " +
          error.message;

        if (lastPosition) {
          resolve(lastPosition);
          return;
        }

        reject(new Error(errorMessage)); // Reject with an error
      },
      options,
    );
  });
}

export function watchHomePositionUpdates() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      async (position) => {
        lastPosition = position;
        await updateGeolocation(position);
      },
      (error) => console.error("Geolocation error: ", error),
      options,
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}

/// Updates the ego position based on the given geolocation.
/// @param position - The geolocation position to update the ego position with. If not provided it uses the last known position.
/// @returns A promise that resolves when the ego position has been updated.
export async function updateGeolocation(
  position?: GeolocationPosition,
): Promise<void> {
  if (!position) {
    if (!lastPosition) {
      console.error("No position provided and no last known position.");
      return;
    }

    position = lastPosition;
  }

  console.log("Updating ego position:", position);

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const altitude = position.coords.altitude;

  const terrainHeight =
    (await getHeight(Cesium.Cartesian3.fromDegrees(longitude, latitude))) ?? 0;

  const accuracy =
    position.coords.accuracy ?? lastGeoPosition?.coords.accuracy ?? 0;

  const altitudeAccuracy =
    position.coords.altitudeAccuracy && position.coords.accuracy
      ? position.coords.altitudeAccuracy
      : accuracy;

  geolocation.value = altitude
    ? Cesium.Cartesian3.fromDegrees(
        longitude,
        latitude,
        altitude + terrainHeight,
      )
    : Cesium.Cartesian3.fromDegrees(longitude, latitude, terrainHeight);

  const egoRadii = new Cesium.Cartesian3(
    accuracy / 2,
    accuracy / 2,
    altitudeAccuracy / 2,
  );

  // Check if the sphere entity exists, create if not
  let sphere = getCesiumViewer().entities.getById("ego-sphere");
  if (!sphere) {
    sphere = getCesiumViewer().entities.add({
      id: "ego-sphere",
      ellipsoid: {
        material: Cesium.Color.fromCssColorString(Colors.GOLD).withAlpha(0.3),
      },
    });
  }

  // Update sphere and label positions
  sphere.position = new Cesium.ConstantPositionProperty(geolocation.value);

  // Update sphere size based on accuracy
  sphere.ellipsoid!.radii = new Cesium.ConstantProperty(egoRadii);

  lastGeoPosition = position;

  // Request render
  getCesiumViewer().scene.requestRender();
}

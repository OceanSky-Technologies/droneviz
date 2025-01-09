import * as Cesium from "cesium";
import { getCesiumViewer } from "@/components/CesiumViewerWrapper";
import { Colors } from "@/utils/Colors";
import { getHeight } from "@/utils/CoordinateUtils";
import { type Ref, ref } from "vue";

let lastGeoPosition: GeolocationPosition | undefined = undefined;

export const egoPosition: Ref<Cesium.Cartesian3 | undefined> = ref(undefined);

export async function updateEgoPosition(
  position: GeolocationPosition,
): Promise<void> {
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

  egoPosition.value =
    altitude !== null
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
  sphere.position = new Cesium.ConstantPositionProperty(egoPosition.value);

  // Update sphere size based on accuracy
  sphere.ellipsoid!.radii = new Cesium.ConstantProperty(egoRadii);

  lastGeoPosition = position;

  // Request render
  getCesiumViewer().scene.requestRender();
}

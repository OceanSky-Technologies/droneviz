import * as Cesium from "cesium";
import { getCesiumViewer } from "@/components/CesiumViewerWrapper";
import { Colors } from "@/utils/Colors";
import { getHeight } from "@/utils/CoordinateUtils";

let lastEgoPosition: GeolocationPosition | undefined = undefined;

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
    position.coords.accuracy ?? lastEgoPosition?.coords.accuracy ?? 0;

  const altitudeAccuracy =
    position.coords.altitudeAccuracy && position.coords.accuracy
      ? position.coords.altitudeAccuracy
      : accuracy;

  const egoPosition =
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
        material: Cesium.Color.fromCssColorString(Colors.BLUE).withAlpha(0.3),
      },
    });
  }

  // Check if the label entity exists, create if not
  let label = getCesiumViewer().entities.getById("ego-label");
  if (!label) {
    label = getCesiumViewer().entities.add({
      id: "ego-label",
      label: {
        text: "H",
        font: "24px sans-serif",
        fillColor: Cesium.Color.fromCssColorString(Colors.GOLD),
        style: Cesium.LabelStyle.FILL,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }

  // Update sphere and label positions
  sphere.position = new Cesium.ConstantPositionProperty(egoPosition);
  label.position = new Cesium.ConstantPositionProperty(egoPosition);

  // Update sphere size based on accuracy
  sphere.ellipsoid!.radii = new Cesium.ConstantProperty(egoRadii);

  lastEgoPosition = position;

  // Request render
  getCesiumViewer().scene.requestRender();
}

import {
  Cartesian3,
  Color,
  LabelStyle,
  HorizontalOrigin,
  VerticalOrigin,
  ConstantPositionProperty,
  Cartographic,
  ConstantProperty,
} from "cesium";
import { getCesiumViewer } from "../components/CesiumViewerWrapper";

export function updateEgoPosition(position: GeolocationPosition): void {
  console.log("Updating ego position:", position);

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const altitude = position.coords.altitude;

  const cartographic = Cartographic.fromDegrees(
    position.coords.longitude,
    position.coords.latitude,
  );

  // increases cesium quota
  //   const terrainHeight = getCesiumViewer().scene.sampleHeight(cartographic);
  const terrainHeight =
    getCesiumViewer().scene.globe.getHeight(cartographic) ?? 0;

  const accuracy = position.coords.accuracy ?? 100;

  const altitudeAccuracy =
    position.coords.altitudeAccuracy && position.coords.accuracy
      ? position.coords.altitudeAccuracy
      : accuracy;

  const egoPosition =
    altitude !== null
      ? Cartesian3.fromDegrees(longitude, latitude, altitude + terrainHeight)
      : Cartesian3.fromDegrees(longitude, latitude, terrainHeight);

  const egoRadii = new Cartesian3(
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
        material: Color.fromCssColorString(Colors.BLUE).withAlpha(0.3),
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
        fillColor: Color.fromCssColorString(Colors.GOLD),
        style: LabelStyle.FILL,
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.CENTER,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }

  // Update sphere and label positions
  sphere.position = new ConstantPositionProperty(egoPosition);
  label.position = new ConstantPositionProperty(egoPosition);

  // Update sphere size based on accuracy
  sphere.ellipsoid!.radii = new ConstantProperty(egoRadii);

  // Request render
  getCesiumViewer().scene.requestRender();
}

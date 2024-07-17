import {
  Cartesian3,
  Color,
  HeadingPitchRoll,
  Math,
  Rectangle,
  Transforms,
  Viewer,
} from "cesium";

import { getLatFromCartesian3, getLonFromCartesian3, move } from "../helpers";

export const text = "Vehicles in Crimea, Ukraine";
export const value = "vehicles-in-crimea-ukraine";

const position = Cartesian3.fromDegrees(33.588049, 45.089763, 37);
const heading = Math.toRadians(180);
const pitch = Math.toRadians(0);
const roll = Math.toRadians(0);

const orientation = Transforms.headingPitchRollQuaternion(
  position,
  new HeadingPitchRoll(heading, pitch, roll),
);

export function getEntities() {
  return [
    {
      position: move(position, 50, 0, 0),
      orientation: orientation,
      model: {
        uri: "../../../resources/GroundVehicle.glb",
        scale: 1.5,
        minimumPixelSize: 50,
        maximumScale: 20000,
      },
    },
    {
      position: move(position, 22, 0, 0),
      orientation: orientation,
      model: {
        uri: "../../../resources/GroundVehicle.glb",
        scale: 1.5,
        minimumPixelSize: 50,
        maximumScale: 20000,
      },
    },
    {
      position: move(position, -10, 0, 0),
      orientation: orientation,
      model: {
        uri: "../../../resources/GroundVehicle.glb",
        scale: 1.5,
        minimumPixelSize: 50,
        maximumScale: 20000,
      },
    },
    {
      position: move(position, -45, 0, 0),
      orientation: orientation,
      model: {
        uri: "../../../resources/GroundVehicle.glb",
        scale: 1.5,
        minimumPixelSize: 50,
        maximumScale: 20000,
      },
    },
    {
      rectangle: {
        coordinates: Rectangle.fromDegrees(
          getLonFromCartesian3(move(position, -65, 0, 0)),
          getLatFromCartesian3(move(position, 0, -20, 0)),
          getLonFromCartesian3(move(position, 70, 0, 0)),
          getLatFromCartesian3(move(position, 0, 20, 0)),
        ),
        height: 38,
        material: Color.RED.withAlpha(0.2),
        outline: true,
        outlineColor: Color.RED,
      },
    },
  ];
}

export function flyTo(viewer: Viewer): void {
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(33.588049, 45.089763, 200),
    orientation: {
      heading: Math.toRadians(0.0),
      pitch: Math.toRadians(-80.0),
    },
  });
}

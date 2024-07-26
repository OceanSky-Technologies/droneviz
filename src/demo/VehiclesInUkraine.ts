import {
  Cartesian3,
  Color,
  Entity,
  HeadingPitchRoll,
  Math,
  Rectangle,
  Transforms,
} from "cesium";

import { getLatLonFromCartesian3, move } from "../helpers";

export const text = "Vehicles in Crimea, Ukraine";
export const value = "vehicles-in-crimea-ukraine";

const position = Cartesian3.fromDegrees(33.588049, 45.089763, 37);
const heading = Math.toRadians(180);
const pitch = Math.toRadians(0);
const roll = Math.toRadians(0);

const modelPath = new URL("../assets/models/GroundVehicle.glb", import.meta.url)
  .href;

const orientation = Transforms.headingPitchRollQuaternion(
  position,
  new HeadingPitchRoll(heading, pitch, roll),
);
/**
 * Creates new demo entities.
 * @returns {Entity.ConstructorOptions[]} New entities
 */
export function getEntities(): Entity.ConstructorOptions[] {
  const rectWest = getLatLonFromCartesian3(move(position, -65, 0, 0)).lon;
  const rectSouth = getLatLonFromCartesian3(move(position, 0, -20, 0)).lat;
  const rectEast = getLatLonFromCartesian3(move(position, 70, 0, 0)).lon;
  const rectNorth = getLatLonFromCartesian3(move(position, 0, 20, 0)).lat;

  return [
    {
      position: move(position, 50, 0, 0),
      orientation,
      model: {
        uri: modelPath,
        scale: 1.5,
        minimumPixelSize: 50,
        maximumScale: 20000,
      },
    },
    {
      position: move(position, 22, 0, 0),
      orientation,
      model: {
        uri: modelPath,
        scale: 1.5,
        minimumPixelSize: 50,
        maximumScale: 20000,
      },
    },
    {
      position: move(position, -10, 0, 0),
      orientation,
      model: {
        uri: modelPath,
        scale: 1.5,
        minimumPixelSize: 50,
        maximumScale: 20000,
      },
    },
    {
      position: move(position, -45, 0, 0),
      orientation,
      model: {
        uri: modelPath,
        scale: 1.5,
        minimumPixelSize: 50,
        maximumScale: 20000,
      },
    },
    {
      rectangle: {
        coordinates: Rectangle.fromDegrees(
          rectWest,
          rectSouth,
          rectEast,
          rectNorth,
        ),
        height: 38,
        material: Color.RED.withAlpha(0.2),
        outline: true,
        outlineColor: Color.RED,
      },
    },
  ];
}

/**
 * Returns a camera position for this demo entity.
 * @returns {object} Camera position
 */
export function getCameraPosition() {
  return {
    destination: Cartesian3.fromDegrees(33.588049, 45.089763, 200),
    orientation: {
      heading: Math.toRadians(0.0),
      pitch: Math.toRadians(-80.0),
    },
  };
}

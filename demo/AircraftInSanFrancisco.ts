import type { Entity } from "cesium";
import { Cartesian3, HeadingPitchRoll, Math, Transforms } from "cesium";

export const text = "Aircraft in San Francisco, U.S.";
export const id = "aircraft-in-san-francisco-us";

const position = Cartesian3.fromDegrees(-122.474276, 37.813799, 400);
const heading = Math.toRadians(-270);
const pitch = Math.toRadians(20);
const roll = Math.toRadians(20);

const modelPath = new URL("assets/models/Plane.glb", import.meta.url).href;

const orientation = Transforms.headingPitchRollQuaternion(
  position,
  new HeadingPitchRoll(heading, pitch, roll),
);

/**
 * Creates a new demo entity.
 * @returns {Entity.ConstructorOptions} New entity
 */
export function getEntity(): Entity.ConstructorOptions {
  return {
    id: id,
    position,
    orientation,
    model: {
      uri: modelPath,
      minimumPixelSize: 50,
      maximumScale: 20000,
    },
  };
}

/**
 * Returns a camera position for this demo entity.
 * @returns {object} Camera position
 */
export function getCameraPosition() {
  return {
    destination: Cartesian3.fromDegrees(-122.472436, 37.812481, 500),
    orientation: {
      heading: Math.toRadians(-45.0),
      pitch: Math.toRadians(-30.0),
    },
  };
}

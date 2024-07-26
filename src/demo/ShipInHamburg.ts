import {
  Cartesian3,
  Transforms,
  HeadingPitchRoll,
  Math,
  Color,
  Entity,
} from "cesium";

export const text = "Ship in Hamburg, Germany";
export const value = "ship-in-hamburg-germany";

const position = Cartesian3.fromDegrees(9.981613, 53.540627, 65);
const heading = Math.toRadians(115);
const pitch = Math.toRadians(0);
const roll = Math.toRadians(0);

const modelPath = new URL("../assets/models/CargoShip.glb", import.meta.url)
  .href;

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
    position,
    orientation,
    point: {
      pixelSize: 10,
      color: Color.YELLOW,
    },
    model: {
      uri: modelPath,
      scale: 100,
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
    destination: Cartesian3.fromDegrees(9.979694, 53.540596, 300),
    orientation: {
      heading: Math.toRadians(70.0),
      pitch: Math.toRadians(-45.0),
    },
  };
}

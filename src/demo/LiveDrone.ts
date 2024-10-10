import {
  Cartesian3,
  Entity,
  HeadingPitchRoll,
  Math,
  Transforms,
  Viewer,
} from "cesium";
import { move } from "@/helpers";

export const text = "Live";
export const id = "live-drone";

const position = Cartesian3.fromDegrees(
  12.492676729145881,
  41.890097155559324,
  71.5,
);
const heading = Math.toRadians(-270);
const pitch = Math.toRadians(0);
const roll = Math.toRadians(0);

const modelPath = new URL("@/assets/models/Skywinger.glb", import.meta.url)
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
    id: id,
    position,
    orientation,
    model: {
      uri: modelPath,
      scale: 1,
      minimumPixelSize: 50,
      maximumScale: 20000,
    },
  };
}

/**
 * Returns a camera position for this demo entity.
 * @param {Viewer} viewer Cesium viewer to get entity position from.
 * @returns {object} Camera position
 */
export function getCameraPosition(viewer: Viewer) {
  const droneEntity = viewer?.entities?.getById("live-drone");
  if (!droneEntity) return {};
  return {
    destination: move(droneEntity.position?.getValue() as Cartesian3, 0, -5, 5),
    orientation: {
      heading: Math.toRadians(0.0),
      pitch: Math.toRadians(-45.0),
    },
  };
}

import { Cartesian3, HeadingPitchRoll, Math, Transforms } from "cesium";

export const text = "Drone in New York, U.S.";
export const value = "drone-in-new-york-us";

const position = Cartesian3.fromDegrees(-74.023996, 40.700533, 450);
const heading = Math.toRadians(-270);
const pitch = Math.toRadians(20);
const roll = Math.toRadians(20);

const modelPath = new URL("../assets/models/PoliceDrone.glb", import.meta.url)
  .href;

const orientation = Transforms.headingPitchRollQuaternion(
  position,
  new HeadingPitchRoll(heading, pitch, roll),
);

export function getEntity() {
  return {
    position: position,
    orientation: orientation,
    model: {
      uri: modelPath,
      scale: 100,
      minimumPixelSize: 50,
      maximumScale: 20000,
    },
  };
}

export function getCameraPosition() {
  return {
    destination: Cartesian3.fromDegrees(-74.025566, 40.700137, 500),
    orientation: {
      heading: Math.toRadians(60.0),
      pitch: Math.toRadians(-20.0),
    },
  };
}

import { Cartesian3, HeadingPitchRoll, Math, Transforms, Viewer } from "cesium";

export const text = "Drone in New York, U.S.";
export const value = "drone-in-new-york-us";

const position = Cartesian3.fromDegrees(-74.023996, 40.700533, 450);
const heading = Math.toRadians(-270);
const pitch = Math.toRadians(20);
const roll = Math.toRadians(20);

const orientation = Transforms.headingPitchRollQuaternion(
  position,
  new HeadingPitchRoll(heading, pitch, roll),
);

export function getEntity() {
  return {
    position: position,
    orientation: orientation,
    model: {
      uri: "../../../resources/PoliceDrone.glb",
      scale: 100,
    },
  };
}

export function flyTo(viewer: Viewer): void {
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(-74.025566, 40.700137, 500),
    orientation: {
      heading: Math.toRadians(60.0),
      pitch: Math.toRadians(-20.0),
    },
  });
}

import { Cartesian3, HeadingPitchRoll, Math, Transforms, Viewer } from "cesium";

export const text = "Aircraft in San Francisco, U.S.";
export const value = "aircraft-in-san-francisco-us";

const position = Cartesian3.fromDegrees(-122.474276, 37.813799, 400);
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
      uri: "../../../resources/Plane.glb",
    },
  };
}

export function flyTo(viewer: Viewer): void {
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(-122.472436, 37.812481, 500),
    orientation: {
      heading: Math.toRadians(-45.0),
      pitch: Math.toRadians(-30.0),
    },
  });
}

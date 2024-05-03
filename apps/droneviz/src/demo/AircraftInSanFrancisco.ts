import { Cartesian3, HeadingPitchRoll, Math, Transforms, Viewer } from "cesium";

export abstract class AircraftInSanFrancisco {
  static text = "Aircraft in San Francisco, U.S.";
  static value = "aircraft-in-san-francisco-us";

  static position = Cartesian3.fromDegrees(-122.474276, 37.813799, 400);
  static heading = Math.toRadians(-270);
  static pitch = Math.toRadians(20);
  static roll = Math.toRadians(20);

  static orientation = Transforms.headingPitchRollQuaternion(
    AircraftInSanFrancisco.position,
    new HeadingPitchRoll(
      AircraftInSanFrancisco.heading,
      AircraftInSanFrancisco.pitch,
      AircraftInSanFrancisco.roll,
    ),
  );

  static getEntity() {
    return {
      position: AircraftInSanFrancisco.position,
      orientation: AircraftInSanFrancisco.orientation,
      model: {
        uri: "../../../resources/Plane.glb",
      },
    };
  }

  static flyTo(viewer: Viewer): void {
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(-122.472436, 37.812481, 500),
      orientation: {
        heading: Math.toRadians(-45.0),
        pitch: Math.toRadians(-30.0),
      },
    });
  }
}

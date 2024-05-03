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

export abstract class VehiclesInUkraine {
  static text = "Vehicles in Crimea, Ukraine";
  static value = "vehicles-in-crimea-ukraine";

  static position = Cartesian3.fromDegrees(33.588049, 45.089763, 37);
  static heading = Math.toRadians(180);
  static pitch = Math.toRadians(0);
  static roll = Math.toRadians(0);

  static orientation = Transforms.headingPitchRollQuaternion(
    VehiclesInUkraine.position,
    new HeadingPitchRoll(
      VehiclesInUkraine.heading,
      VehiclesInUkraine.pitch,
      VehiclesInUkraine.roll,
    ),
  );

  static getEntities() {
    return [
      {
        position: move(VehiclesInUkraine.position, 50, 0, 0),
        orientation: VehiclesInUkraine.orientation,
        model: {
          uri: "../../../resources/GroundVehicle.glb",
          scale: 1.5,
        },
      },
      {
        position: move(VehiclesInUkraine.position, 22, 0, 0),
        orientation: VehiclesInUkraine.orientation,
        model: {
          uri: "../../../resources/GroundVehicle.glb",
          scale: 1.5,
        },
      },
      {
        position: move(VehiclesInUkraine.position, -10, 0, 0),
        orientation: VehiclesInUkraine.orientation,
        model: {
          uri: "../../../resources/GroundVehicle.glb",
          scale: 1.5,
        },
      },
      {
        position: move(VehiclesInUkraine.position, -45, 0, 0),
        orientation: VehiclesInUkraine.orientation,
        model: {
          uri: "../../../resources/GroundVehicle.glb",
          scale: 1.5,
        },
      },
      {
        rectangle: {
          coordinates: Rectangle.fromDegrees(
            getLonFromCartesian3(move(VehiclesInUkraine.position, -65, 0, 0)),
            getLatFromCartesian3(move(VehiclesInUkraine.position, 0, -20, 0)),
            getLonFromCartesian3(move(VehiclesInUkraine.position, 70, 0, 0)),
            getLatFromCartesian3(move(VehiclesInUkraine.position, 0, 20, 0)),
          ),
          height: 38,
          material: Color.RED.withAlpha(0.2),
          outline: true,
          outlineColor: Color.RED,
        },
      },
    ];
  }

  static flyTo(viewer: Viewer): void {
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(33.588049, 45.089763, 200),
      orientation: {
        heading: Math.toRadians(0.0),
        pitch: Math.toRadians(-80.0),
      },
    });
  }
}

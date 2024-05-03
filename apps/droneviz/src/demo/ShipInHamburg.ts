import {
  Cartesian3,
  Color,
  HeadingPitchRoll,
  Math,
  Transforms,
  Viewer,
} from "cesium";

export abstract class ShipInHamburg {
  static text = "Ship in Hamburg, Germany";
  static value = "ship-in-hamburg-germany";

  static position = Cartesian3.fromDegrees(9.981613, 53.540627, 65);
  static heading = Math.toRadians(115);
  static pitch = Math.toRadians(0);
  static roll = Math.toRadians(0);

  static orientation = Transforms.headingPitchRollQuaternion(
    ShipInHamburg.position,
    new HeadingPitchRoll(
      ShipInHamburg.heading,
      ShipInHamburg.pitch,
      ShipInHamburg.roll,
    ),
  );

  static getEntity() {
    return {
      position: ShipInHamburg.position,
      orientation: ShipInHamburg.orientation,
      point: {
        pixelSize: 10,
        color: Color.YELLOW,
      },
      model: {
        uri: "../../../resources/CargoShip.glb",
        scale: 100,
      },
    };
  }

  static flyTo(viewer: Viewer): void {
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(9.979694, 53.540596, 300),
      orientation: {
        heading: Math.toRadians(70.0),
        pitch: Math.toRadians(-45.0),
      },
    });
  }
}

// function addBillboardAndRectangle() {
//   viewer.entities.add({
//     position: Cartesian3.fromDegrees(-75.598216, 40.038669, 200),
//     billboard: {
//       image: "../../../resources/Cesium_Air.glb",
//       distanceDisplayCondition: new DistanceDisplayCondition(5.5e6),
//     },
//     rectangle: {
//       coordinates: Rectangle.fromDegrees(-80.5, 39.7, -75.1, 42.0),
//       height: 0.0,
//       material: Color.RED.withAlpha(0.5),
//       outline: true,
//       outlineColor: Color.RED,
//       distanceDisplayCondition: new DistanceDisplayCondition(0.0, 5.5e6),
//     },
//   });
// }

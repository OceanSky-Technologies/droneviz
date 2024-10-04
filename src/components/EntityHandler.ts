import { System } from "../../mavlink-ts/src/System";
import {
  AltitudeResponse,
  AttitudeEulerResponse,
  HeadingResponse,
  PositionResponse,
} from "mavlink-ts/protobuf-gen/telemetry/telemetry";
import * as egm96 from "egm96-universal";
import { Cartesian3, Viewer } from "cesium";

// THIS FILE GETS REFACTORED ANYWAY!!
/* eslint-disable */

export async function run(viewer: Viewer) {
  const droneEntity = viewer.entities!.getById("live-drone")!;

  // create a new drone instance
  console.log("Establishing connection");

  const drone = new System("http://127.0.0.1", 60000);
  drone.telemetry.subscribeAll();

  console.log("Reading data");

  let lastAltitudeLocalM = 0;
  let lastHeading = 0;

  drone.telemetry.altitude?.responses.onMessage(
    (altitude: AltitudeResponse) => {
      // console.log("New altitude received:\n" + JSON.stringify(altitude));

      lastAltitudeLocalM = altitude!.altitude!.altitudeLocalM!;
    },
  );

  drone.telemetry.position?.responses.onMessage(
    (position: PositionResponse) => {
      // console.log("New position received:\n" + JSON.stringify(position));

      if (position.position) {
        const altitude =
          lastAltitudeLocalM +
          egm96.meanSeaLevel(
            position.position.latitudeDeg,
            position.position.longitudeDeg,
          ) +
          egm96.egm96ToEllipsoid(
            position.position.latitudeDeg,
            position.position.longitudeDeg,
            0,
          );
        // console.log(altitude);

        droneEntity.position = {
          ...Cartesian3.fromDegrees(
            position.position.longitudeDeg,
            position.position.latitudeDeg,
            altitude,
          ),
        };

        viewer.scene.requestRender();
      }
    },
  );

  drone.telemetry.heading?.responses.onMessage((heading: HeadingResponse) => {
    // console.log("heading:" + JSON.stringify(heading));
    lastHeading = heading.headingDeg!.headingDeg;
  });

  drone.telemetry.attitudeEuler?.responses.onMessage(
    (attitudeEulerResponse: AttitudeEulerResponse) => {
      // console.log(
      //   "New attitudeEulerResponse received:\n" +
      //     JSON.stringify(attitudeEulerResponse),
      // );

      if (
        lastHeading &&
        attitudeEulerResponse.attitudeEuler &&
        droneEntity.position
      ) {
        droneEntity.orientation = {
          ...Transforms.headingPitchRollQuaternion(
            droneEntity.position!.getValue()!,
            HeadingPitchRoll.fromDegrees(
              lastHeading,
              attitudeEulerResponse.attitudeEuler.pitchDeg,
              attitudeEulerResponse.attitudeEuler.rollDeg,
            ),
          ),
        };

        viewer.scene.requestRender();
      }
    },
  );

  drone.telemetry.position?.responses.onComplete(() => {
    console.log("Stream complete");
  });

  drone.telemetry.position?.responses.onError((error: Error) => {
    console.log("Stream error: " + error);
  });
}

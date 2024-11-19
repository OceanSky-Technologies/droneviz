import {
  Cartesian3,
  Cartographic,
  ConstantPositionProperty,
  ConstantProperty,
  Ellipsoid,
  Entity,
  HeightReference,
  Math,
  Matrix4,
  Transforms,
} from "cesium";
import {
  egm96ToEllipsoid,
  ellipsoidToEgm96,
  meanSeaLevel,
} from "egm96-universal";
import type { GlobalPositionInt } from "mavlink-mappings/dist/lib/common";
import { MavState, type Heartbeat } from "mavlink-mappings/dist/lib/minimal";
import {
  getCesiumViewer,
  googleTilesEnabled,
} from "~/components/CesiumViewerWrapper";

/**
 * Moves a 3D coordinate by a vector.
 * @param {Cartesian3} orig Original coordinate
 * @param {number} x X transition (meters)
 * @param {number} y Y transition (meters)
 * @param {number} z Z transition (meters)
 * @returns {Cartesian3} New 3D coordinate
 */
export function move(
  orig: Cartesian3,
  x: number,
  y: number,
  z: number,
): Cartesian3 {
  return Matrix4.multiplyByPoint(
    Transforms.eastNorthUpToFixedFrame(orig),
    new Cartesian3(x, y, z),
    new Cartesian3(),
  );
}

/**
 * Get the longitude and latitude from 3D coordinates.
 * @param {Cartesian3} pos 3D coordinates
 * @returns { {lat: number; lon: number;} } latitude and longitude
 */
export function getLatLonFromCartesian3(pos: Cartesian3): {
  lat: number;
  lon: number;
} {
  const carto = Ellipsoid.WGS84.cartesianToCartographic(pos);
  const lon = Math.toDegrees(carto.longitude);
  const lat = Math.toDegrees(carto.latitude);

  return { lat, lon };
}

export function setAltitude(
  entity: Entity,
  message: GlobalPositionInt,
  heartbeat?: Heartbeat,
) {
  let altitude = undefined;

  const longitude = message.lon / 1e7;
  const latitude = message.lat / 1e7;

  const cartographic = Cartographic.fromDegrees(longitude, latitude);

  let groundHeight;

  if (googleTilesEnabled()) {
    groundHeight = getCesiumViewer().scene.sampleHeight(cartographic);

    // TODO: oh no, google tiles have an offset to the ellipsoid but I didn't figure out how to fix this
    // -> altitude is off by a bit
    altitude =
      meanSeaLevel(latitude, longitude) +
      message.alt / 1000 +
      message.relativeAlt / 1000;
  } else {
    groundHeight = getCesiumViewer().scene.globe.getHeight(cartographic); // alternative: sampleTerrain (increases quota!)

    if (groundHeight !== undefined)
      // TODO: this could have drift for long flights -> use absolute altitude (message.alt) in future
      altitude = groundHeight + message.relativeAlt / 1000;
    else {
      console.warn("Terrain height not available");
      return;
    }
  }

  if (altitude === undefined) return;

  entity.position = new ConstantPositionProperty(
    Cartesian3.fromDegrees(longitude, latitude, altitude),
  );

  if (heartbeat === undefined) return;

  // clamp model to ground if it's below terrain (only if it's not flying to prevent sampleHeight jumps causing issues)
  if (
    heartbeat.systemStatus !== MavState.ACTIVE &&
    entity.model &&
    groundHeight &&
    altitude < groundHeight
  ) {
    entity.model.heightReference = new ConstantProperty(
      HeightReference.CLAMP_TO_GROUND,
    );
    console.log("clamping");
  } else {
    if (entity.model) entity.model.heightReference = undefined;
  }
}

import type { Entity } from "cesium";
import {
  Cartesian3,
  ConstantPositionProperty,
  ConstantProperty,
  Ellipsoid,
  HeightReference,
  Math,
  Matrix4,
  Transforms,
} from "cesium";
import { egm96ToEllipsoid } from "egm96-universal";
import type { GlobalPositionInt } from "mavlink-mappings/dist/lib/common";

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

/**
 * Formats a coordinate to a string.
 * @param {number} coordinate Coordinate
 * @returns {string} Formatted coordinate (degrees)
 */
export function formatCoordinate(coordinate?: number): string {
  if (coordinate === undefined) return "undefined";

  // 6 decimal places equal 10 cm resolution. 12 digits are maximum.
  return coordinate.toFixed(6).padStart(12, " ") + "°";
}

/**
 * Formats an altitude to a string.
 * @param {number} altitude Altitude (meters)
 * @returns {string} Formatted altitude
 */
export function formatAltitude(altitude?: number): string {
  if (!altitude) return "undefined";

  return altitude.toFixed(2).padStart(12, " ") + "m";
}

export function setPosition(entity: Entity, message: GlobalPositionInt) {
  const longitude = message.lon / 1e7;
  const latitude = message.lat / 1e7;

  const altitude = egm96ToEllipsoid(latitude, longitude, message.alt / 1000);

  // TODO: clamp model to ground if it's below terrain. Use correct reference instead of "0"
  if (entity.model) {
    if (altitude < 0) {
      // TODO: replace 0 with terrain / 3D tile height
      if (
        entity.model.heightReference?.getValue() !==
        HeightReference.CLAMP_TO_GROUND
      )
        entity.model.heightReference = new ConstantProperty(
          HeightReference.CLAMP_TO_GROUND,
        );
    } else {
      if (entity.model.heightReference?.getValue() !== HeightReference.NONE)
        entity.model.heightReference = new ConstantProperty(
          HeightReference.NONE,
        );
    }
  }

  entity.position = new ConstantPositionProperty(
    Cartesian3.fromDegrees(longitude, latitude, altitude),
  );
}

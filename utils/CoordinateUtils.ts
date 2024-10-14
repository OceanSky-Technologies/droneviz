import { Cartesian3, Ellipsoid, Math, Matrix4, Transforms } from "cesium";

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

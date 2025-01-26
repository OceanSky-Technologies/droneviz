import * as Cesium from "cesium";
import { egm96ToEllipsoid } from "egm96-universal";
import type { GlobalPositionInt } from "mavlink-mappings/dist/lib/common";
import {
  getCesiumViewer,
  googleTilesEnabled,
} from "@/components/CesiumViewerWrapper";
import { settings } from "./Settings";

/**
 * Moves a 3D coordinate by a vector.
 * @param {Cartesian3} orig Original coordinate
 * @param {number} x X transition (meters)
 * @param {number} y Y transition (meters)
 * @param {number} z Z transition (meters)
 * @returns {Cartesian3} New 3D coordinate
 */
export function move(
  orig: Cesium.Cartesian3,
  x: number,
  y: number,
  z: number,
): Cesium.Cartesian3 {
  return Cesium.Matrix4.multiplyByPoint(
    Cesium.Transforms.eastNorthUpToFixedFrame(orig),
    new Cesium.Cartesian3(x, y, z),
    new Cesium.Cartesian3(),
  );
}

/**
 * Get the longitude and latitude from 3D coordinates.
 * @param {Cartesian3} pos 3D coordinates
 * @returns { {lat: number; lon: number;} } latitude and longitude
 */
export function getLatLonFromCartesian3(pos: Cesium.Cartesian3): {
  lat: number;
  lon: number;
} {
  const carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(pos);
  const lon = Cesium.Math.toDegrees(carto.longitude);
  const lat = Cesium.Math.toDegrees(carto.latitude);

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
  return coordinate.toFixed(6) + "°";
}

/**
 * Formats an altitude to a string.
 * @param {number} altitude Altitude (meters)
 * @returns {string} Formatted altitude
 */
export function formatAltitude(altitude?: number): string {
  if (!altitude) return "undefined";

  return altitude.toFixed(2) + "m";
}

export function calculateCartesian3Position(
  entity: Cesium.Entity | undefined,
  message: GlobalPositionInt,
): Cesium.Cartesian3 {
  const longitude = message.lon / 1e7;
  const latitude = message.lat / 1e7;

  // Convert from EGM96 MSL altitude to WGS84 ellipsoidal altitude.
  // If the GPS sensor uses EGM2008, this will be slightly incorrect.
  const altitude = egm96ToEllipsoid(latitude, longitude, message.alt / 1000);

  // console.log(message);
  // console.log(altitude);
  if (googleTilesEnabled()) {
    // fix offset for google tiles
  }

  // TODO: clamp model to ground if it's below terrain. Use correct reference instead of "0"
  if (entity && entity.model) {
    if (altitude < 0) {
      // TODO: replace 0 with terrain / 3D tile height
      if (
        entity.model.heightReference?.getValue() !==
        Cesium.HeightReference.CLAMP_TO_GROUND
      )
        entity.model.heightReference = new Cesium.ConstantProperty(
          Cesium.HeightReference.CLAMP_TO_GROUND,
        );
    } else {
      if (
        entity.model.heightReference?.getValue() !== Cesium.HeightReference.NONE
      )
        entity.model.heightReference = new Cesium.ConstantProperty(
          Cesium.HeightReference.NONE,
        );
    }
  }

  return Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude);
}

/**
 * Returns the correct height of the terrain at the given cartographic position with enabled and disabled 3D Google tiles.
 * @param cartesian The cartesian3 position.
 * @param cartographicIn The cartographic position (optional). If not provided, the cartographic position will be calculated form the cartesian.
 * @returns The height of the terrain/3D scene at the given position or undefined.
 */
export async function getHeight(
  cartesian: Cesium.Cartesian3,
  cartographicIn?: Cesium.Cartographic,
): Promise<number | undefined> {
  let height: number | undefined = undefined;

  if (googleTilesEnabled()) {
    if (getCesiumViewer().scene.clampToHeightSupported) {
      if (settings.mousePositionInfoMostDetailed.value) {
        // increases quota!
        const tmpResult =
          await getCesiumViewer().scene.clampToHeightMostDetailed([cartesian]);

        if (tmpResult.length > 0 && tmpResult[0])
          height = Cesium.Cartographic.fromCartesian(tmpResult[0]).height;

        if (height !== undefined) return height;
      }

      // alternative that doesn't cost quota: clampToTeight
      const tmpResult2 = getCesiumViewer().scene.clampToHeight(cartesian);
      if (tmpResult2 !== undefined)
        height = Cesium.Cartographic.fromCartesian(tmpResult2).height;

      if (height !== undefined) return height;
    }

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    height = getCesiumViewer().scene.sampleHeight(cartographic);
    if (height !== undefined) return height;

    // fallback: scene.globe.getHeight
    height = getCesiumViewer().scene.globe.getHeight(cartographic);
    return height;
  } else {
    const cartographic =
      cartographicIn ?? Cesium.Cartographic.fromCartesian(cartesian);

    if (settings.mousePositionInfoMostDetailed.value) {
      // increases quota!
      const tmpResult = await Cesium.sampleTerrainMostDetailed(
        getCesiumViewer().terrainProvider,
        [cartographic],
      );

      if (tmpResult.length > 0 && tmpResult[0]) height = tmpResult[0].height;

      if (height !== undefined) return height;

      // fallback: sampleTerrain still triggers the cesium API and increases quota!
      const tmpResult2 = await Cesium.sampleTerrain(
        getCesiumViewer().terrainProvider,
        11,
        [cartographic],
      );

      if (tmpResult2.length > 0 && tmpResult2[0]) height = tmpResult2[0].height;

      if (height !== undefined) return height;
    }

    // sampleTerrain still triggers the cesium API and increases quota!
    return getCesiumViewer().scene.globe.getHeight(cartographic);
  }
}

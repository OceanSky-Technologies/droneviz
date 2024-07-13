import { Cartesian3, Ellipsoid, Matrix4, Transforms, Math } from "cesium";

export function move(
  orig: Cartesian3,
  x_meters: number,
  y_meters: number,
  z_meters: number,
) {
  return Matrix4.multiplyByPoint(
    Transforms.eastNorthUpToFixedFrame(orig),
    new Cartesian3(x_meters, y_meters, z_meters),
    new Cartesian3(),
  );
}

export function getLonFromCartesian3(pos: Cartesian3) {
  const carto = Ellipsoid.WGS84.cartesianToCartographic(pos);
  const lon = Math.toDegrees(carto.longitude);

  return lon;
}

export function getLatFromCartesian3(pos: Cartesian3) {
  const carto = Ellipsoid.WGS84.cartesianToCartographic(pos);
  const lat = Math.toDegrees(carto.latitude);

  return lat;
}

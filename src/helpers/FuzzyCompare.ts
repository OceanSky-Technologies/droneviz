export function almostEqual(
  v1: number,
  v2: number,
  epsilon: number = Number.EPSILON,
) {
  return Math.abs(v1 - v2) < epsilon;
}

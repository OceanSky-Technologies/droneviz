/**
 * Checks if two numbers are almost equal (using epsilon).
 * @param {number} x first number
 * @param {number} y second number
 * @param {number} epsilon maximum difference threshold (default: Number.EPSILON)
 * @returns {boolean} true if numbers are almost equal, false if not
 */
export function almostEqual(
  x: number,
  y: number,
  epsilon: number = Number.EPSILON,
): boolean {
  return Math.abs(x - y) < epsilon;
}

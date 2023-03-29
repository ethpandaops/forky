/*
 * Given the start angle in radians, and the percentage of the circle to draw,
 * return the end angle in radians.
 */
export function arcToRadiansByPercentage(fromRadians: number, percentage: number): number {
  if (percentage < 0 || Number.isNaN(percentage)) return 0;
  const radiansPerPercent = (2 * Math.PI) / 100;
  const endAngleRadians = fromRadians + percentage * radiansPerPercent;
  return endAngleRadians;
}

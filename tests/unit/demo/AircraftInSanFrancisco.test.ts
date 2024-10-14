import { Cartesian3 } from "cesium";
import { getCameraPosition, getEntity } from "~/demo/AircraftInSanFrancisco";
import { describe, expect, test } from "vitest";

describe("AircraftInSanFrancisco", () => {
  test("Entity position", () => {
    const entity = getEntity();
    expect(entity.position).toBeDefined();
    expect(entity.position).not.toEqual(Cartesian3.fromDegrees(0, 0, 0));
  });

  test("Entity orientation", () => {
    const entity = getEntity();
    expect(entity.orientation).toBeDefined();
  });

  test("Entity model", () => {
    const entity = getEntity();
    expect(entity.model).toBeDefined();
  });

  test("Camera position", () => {
    const pos = getCameraPosition();
    expect(pos).toBeDefined();
  });
});

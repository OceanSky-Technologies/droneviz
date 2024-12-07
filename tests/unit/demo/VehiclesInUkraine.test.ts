import { Cartesian3, Rectangle } from "cesium";
import { getCameraPosition, getEntities } from "@/demo/VehiclesInUkraine";
import { describe, expect, test } from "vitest";

describe("VehiclesInUkraine", () => {
  test("Entity position", () => {
    const entities = getEntities();
    expect(entities.at(0)!.position).toBeDefined();
    expect(entities.at(1)!.position).toBeDefined();
    expect(entities.at(2)!.position).toBeDefined();
    expect(entities.at(3)!.position).toBeDefined();

    expect(entities.at(0)!.position).not.toEqual(
      Cartesian3.fromDegrees(0, 0, 0),
    );
    expect(entities.at(1)!.position).not.toEqual(
      Cartesian3.fromDegrees(0, 0, 0),
    );
    expect(entities.at(2)!.position).not.toEqual(
      Cartesian3.fromDegrees(0, 0, 0),
    );
    expect(entities.at(3)!.position).not.toEqual(
      Cartesian3.fromDegrees(0, 0, 0),
    );

    expect(entities.at(4)!.rectangle!.coordinates).toBeDefined();
    expect(entities.at(4)!.rectangle!.coordinates).not.toEqual(
      Rectangle.fromDegrees(0, 0, 0),
    );
  });

  test("Entity orientation", () => {
    const entities = getEntities();
    expect(entities.at(0)!.orientation).toBeDefined();
    expect(entities.at(1)!.orientation).toBeDefined();
    expect(entities.at(2)!.orientation).toBeDefined();
    expect(entities.at(3)!.orientation).toBeDefined();
  });

  test("Entity model", () => {
    const entities = getEntities();
    expect(entities.at(0)!.model).toBeDefined();
    expect(entities.at(1)!.model).toBeDefined();
    expect(entities.at(2)!.model).toBeDefined();
    expect(entities.at(3)!.model).toBeDefined();
  });

  test("Camera position", () => {
    const pos = getCameraPosition();
    expect(pos).toBeDefined();
  });
});

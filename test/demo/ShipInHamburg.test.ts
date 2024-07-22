import { Cartesian3 } from "cesium";
import { getEntity } from "../../src/demo/ShipInHamburg";

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

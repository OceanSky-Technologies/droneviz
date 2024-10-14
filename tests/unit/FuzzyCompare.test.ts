import { almostEqual } from "~/utils/FuzzyCompare";

describe("Almost equal (numbers)", () => {
  test("Same numbers are equal", () => {
    const a = 55.6678;
    const b = a;
    expect(almostEqual(a, b)).toBeTruthy();
  });

  test("Different numbers are not equal", () => {
    const x1 = 55.6678;
    const x2 = 11.22;
    expect(almostEqual(x1, x2)).toBeFalsy();

    const y1 = 55.6678;
    const y2 = y1 - 0.00002;
    expect(almostEqual(y1, y2, 0.00001)).toBeFalsy();
  });

  test("Numbers closer than epsilon are equal", () => {
    const a = 55.6678;
    const b = a - 0.00001;
    expect(almostEqual(a, b, 0.00002)).toBeTruthy();
  });
});

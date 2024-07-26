/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { enableAutoUnmount } from "@vue/test-utils";
import CesiumHighlighter from "../../src/components/CesiumHighlighter.vue";
import { Color, Entity, Scene } from "cesium";
import { GOLD } from "../../src/helpers/Colors";

enableAutoUnmount(afterEach);

describe("CesiumHighlighter", () => {
  test("Create CesiumHighlighter", () => {
    const canvasElement = document.createElement("canvas") as HTMLCanvasElement;
    document.body.appendChild(canvasElement);
    const scene = new Scene({ canvas: canvasElement });
    new CesiumHighlighter(scene);

    expect(
      () => new CesiumHighlighter(undefined as unknown as Scene),
    ).toThrowError();
  });

  test("Create CesiumHighlighter with color", () => {
    const canvasElement = document.createElement("canvas") as HTMLCanvasElement;
    document.body.appendChild(canvasElement);
    const scene = new Scene({ canvas: canvasElement });
    new CesiumHighlighter(scene, new Color(1.0, 0.5, 0.25));
  });

  test("Create CesiumHighlighter with invalid color", () => {
    const canvasElement = document.createElement("canvas") as HTMLCanvasElement;
    document.body.appendChild(canvasElement);
    const scene = new Scene({ canvas: canvasElement });

    expect(
      () =>
        new CesiumHighlighter(scene, new Color(5.0, 0.0, 0.0, 0.0), undefined),
    ).toThrowError();

    expect(
      () =>
        new CesiumHighlighter(scene, new Color(0.0, 5.0, 0.0, 0.0), undefined),
    ).toThrowError();

    expect(
      () =>
        new CesiumHighlighter(scene, new Color(0.0, 0.0, 5.0, 0.0), undefined),
    ).toThrowError();

    expect(
      () =>
        new CesiumHighlighter(scene, new Color(0.0, 0.0, 0.0, 5.0), undefined),
    ).toThrowError();
  });

  test("Create CesiumHighlighter with invalid silhouette", () => {
    const canvasElement = document.createElement("canvas") as HTMLCanvasElement;
    document.body.appendChild(canvasElement);
    const scene = new Scene({ canvas: canvasElement });

    expect(
      () =>
        new CesiumHighlighter(scene, undefined, {
          color: new Color(5.0, 0.0, 0.0, 0.0),
          size: 5,
        }),
    ).toThrowError();

    expect(
      () =>
        new CesiumHighlighter(scene, undefined, {
          color: new Color(0.0, 5.0, 0.0, 0.0),
          size: 5,
        }),
    ).toThrowError();

    expect(
      () =>
        new CesiumHighlighter(scene, undefined, {
          color: new Color(0.0, 0.0, 5.0, 0.0),
          size: 5,
        }),
    ).toThrowError();

    expect(
      () =>
        new CesiumHighlighter(scene, undefined, {
          color: new Color(0.0, 0.0, 0.0, 5.0),
          size: 5,
        }),
    ).toThrowError();

    expect(
      () =>
        new CesiumHighlighter(scene, undefined, {
          color: new Color(0.0, 1.0, 0.0, 0.0),
          size: -6,
        }),
    ).toThrowError();
  });

  test("Create CesiumHighlighter with silhouette", () => {
    const canvasElement = document.createElement("canvas") as HTMLCanvasElement;
    document.body.appendChild(canvasElement);
    const scene = new Scene({ canvas: canvasElement });
    new CesiumHighlighter(scene, undefined, {
      color: Color.fromCssColorString(GOLD),
      size: 5,
    });
  });

  test("Contains/add/remove", async () => {
    const canvasElement = document.createElement("canvas") as HTMLCanvasElement;
    document.body.appendChild(canvasElement);
    const scene = new Scene({ canvas: canvasElement });
    const highlighter = new CesiumHighlighter(scene, new Color(0.2, 0.2, 0.2), {
      color: new Color(1.0, 0.0, 0.0),
      size: 2,
    });

    const entity = new Entity();

    expect(highlighter.contains(entity)).toBeFalsy();

    highlighter.add(entity);

    expect(highlighter.contains(entity)).toBeTruthy();

    highlighter.remove(entity);

    expect(highlighter.contains(entity)).toBeFalsy();

    // try to remove same entity again
    highlighter.remove(entity);
    expect(highlighter.contains(entity)).toBeFalsy();

    // invalid entities
    expect(() =>
      highlighter.contains(undefined as unknown as Entity),
    ).toThrowError();

    expect(() => highlighter.add(undefined)).toThrowError();

    expect(() => highlighter.remove(undefined)).toThrowError();
  });

  test("Empty / clear / setArray", () => {
    const canvasElement = document.createElement("canvas") as HTMLCanvasElement;
    document.body.appendChild(canvasElement);
    const scene = new Scene({ canvas: canvasElement });
    const highlighter = new CesiumHighlighter(scene);

    expect(highlighter.empty()).toBeTruthy();

    const modelPath = new URL("../../assets/models/Plane.glb", import.meta.url)
      .href;

    const entities = [
      new Entity({ model: { uri: modelPath } }),
      new Entity(),
      new Entity(),
    ];
    highlighter.setArray(entities);

    expect(highlighter.empty()).toBeFalsy();

    highlighter.clear();

    expect(highlighter.empty()).toBeTruthy();
  });

  test("GetEntities/getEntityIds", () => {
    const canvasElement = document.createElement("canvas") as HTMLCanvasElement;
    document.body.appendChild(canvasElement);
    const scene = new Scene({ canvas: canvasElement });
    const highlighter = new CesiumHighlighter(scene);

    const entities = [
      new Entity({ id: "5" }),
      new Entity({ id: "!!!" }),
      new Entity({ id: "hello" }),
    ];
    for (const entity of entities) highlighter.add(entity);

    const storedEntities = highlighter.getEntities();
    expect(storedEntities.length).toBe(3);
    for (let i = 0; i < storedEntities.length; i++)
      expect(storedEntities[i]).toEqual(entities[i]);

    const storedEntityIds = highlighter.getEntityIds();
    expect(storedEntityIds.length).toBe(3);
    for (let i = 0; i < storedEntityIds.length; i++)
      expect(storedEntityIds[i]).toEqual(entities[i]!.id);
  });
});

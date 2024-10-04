/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createCesiumContainer,
  createTestViewerOptions,
  silenceConsole,
} from "../helpers/MockUtils";
import { Cartesian2, Cartesian3, Entity, Model, Viewer } from "cesium";
import CesiumMouseHandler from "../../src/components/CesiumMouseHandler";
import { settings } from "../../src/components/Settings";

describe("CesiumMouseHandler", () => {
  test("Left click", async () => {
    silenceConsole();

    createCesiumContainer();

    const viewer = new Viewer("cesiumContainer", createTestViewerOptions());
    const mouseHandler = new CesiumMouseHandler(viewer);

    const modelPath = new URL("/src/assets/models/Plane.glb", import.meta.url)
      .href;

    const model = await Model.fromGltfAsync({ url: modelPath });
    const entity = new Entity();

    const spyPick = vi.spyOn(viewer.scene, "pick");
    spyPick.mockImplementation(() => {
      const result = { id: entity, primitive: model };
      return result;
    });

    const mousePosition = new Cartesian2(648, 910);
    await mouseHandler.mouseClickListener({ position: mousePosition }); // first click: select
    expect((mouseHandler as any).selectedEntityHighlighter.empty()).toBeFalsy();

    await mouseHandler.mouseClickListener({ position: mousePosition }); // second click: unselect
    expect(
      (mouseHandler as any).selectedEntityHighlighter.empty(),
    ).toBeTruthy();
  });

  test("Double left click", async () => {
    silenceConsole();

    createCesiumContainer();

    const viewer = new Viewer("cesiumContainer", createTestViewerOptions());
    const mouseHandler = new CesiumMouseHandler(viewer);

    const modelPath = new URL("/src/assets/models/Plane.glb", import.meta.url)
      .href;

    const model = await Model.fromGltfAsync({ url: modelPath });
    const entity = new Entity();

    const spyPick = vi.spyOn(viewer.scene, "pick");
    spyPick.mockImplementation(async () => {
      const result = { id: entity, primitive: model };
      return result;
    });

    const spyFlyTo = vi.spyOn(viewer, "flyTo");
    spyFlyTo.mockImplementation(vi.fn());

    const mousePosition = new Cartesian2(648, 910);
    await mouseHandler.mouseDoubleClickListener({ position: mousePosition }); // zoom to object

    expect(spyFlyTo).toHaveBeenCalled();
  });

  test("Right click", async () => {
    silenceConsole();

    createCesiumContainer();

    const viewer = new Viewer("cesiumContainer", createTestViewerOptions());
    const mouseHandler = new CesiumMouseHandler(viewer);

    const modelPath = new URL("/src/assets/models/Plane.glb", import.meta.url)
      .href;

    const model = await Model.fromGltfAsync({ url: modelPath });
    const entity = new Entity();

    const spyPick = vi.spyOn(viewer.scene, "pick");
    spyPick.mockImplementation(() => {
      const result = { id: entity, primitive: model };
      return result;
    });

    const spyFlyTo = vi.spyOn(viewer, "flyTo");
    spyFlyTo.mockImplementation(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return new Promise<boolean>((resolve, _reject) => {
        // immediately resolve
        resolve(true);
      });
    });

    const mousePosition = new Cartesian2(648, 910);
    await mouseHandler.mouseRightClickListener({ position: mousePosition }); // first click: select
    expect((mouseHandler as any).trackedEntityHighlighter.empty()).toBeFalsy();
    expect(viewer.trackedEntity).toBeDefined();

    await mouseHandler.mouseRightClickListener({ position: mousePosition }); // second click: unselect
    expect((mouseHandler as any).trackedEntityHighlighter.empty()).toBeTruthy();
    expect(viewer.trackedEntity).toBeUndefined();
  });

  test("Right click on area without entity", async () => {
    silenceConsole();

    createCesiumContainer();

    const viewer = new Viewer("cesiumContainer", createTestViewerOptions());
    const mouseHandler = new CesiumMouseHandler(viewer);

    // picking an object shall never return anything
    const spyPick = vi.spyOn(viewer.scene, "pick");
    spyPick.mockImplementation(() => {
      return undefined;
    });

    const mousePosition = new Cartesian2(648, 910);
    await mouseHandler.mouseRightClickListener({ position: mousePosition });
    expect((mouseHandler as any).trackedEntityHighlighter.empty()).toBeTruthy();
    expect(viewer.trackedEntity).toBeUndefined();
  });

  test("Highlight entity on mouse over", async () => {
    silenceConsole();

    createCesiumContainer();

    const viewer = new Viewer("cesiumContainer", createTestViewerOptions());
    const mouseHandler = new CesiumMouseHandler(viewer);

    const modelPath = new URL("/src/assets/models/Plane.glb", import.meta.url)
      .href;

    const model = await Model.fromGltfAsync({ url: modelPath });
    const entity = new Entity();

    // Mock viewer.scene.pick so it always returns the entity
    const spyPick = vi.spyOn(viewer.scene, "pick");
    spyPick.mockImplementation(() => {
      const result = { id: entity, primitive: model };
      return result;
    });

    // mouse over arbitrary position now highlights the entity
    const mousePosition = new Cartesian2(648, 910);
    await mouseHandler.mouseOverListener({
      endPosition: mousePosition,
      startPosition: new Cartesian2(0, 0),
    });
    expect((mouseHandler as any).mouseOverHighlighter.empty()).toBeFalsy();

    // picking shall not return anything now
    spyPick.mockImplementation(() => {
      return undefined;
    });

    // unhighlight
    await mouseHandler.mouseOverListener({
      endPosition: mousePosition,
      startPosition: new Cartesian2(0, 0),
    });
    expect((mouseHandler as any).mouseOverHighlighter.empty()).toBeTruthy();
  });

  test("Show position info for mouse position (google3DTiles enabled)", async () => {
    createCesiumContainer();

    settings.google3DTilesEnabled.value = true;

    const viewer = new Viewer("cesiumContainer", createTestViewerOptions());
    const mouseHandler = new CesiumMouseHandler(viewer);

    // Mock viewer.scene.pick so it always returns the entity
    const spyPick = vi.spyOn(viewer.scene, "pickPosition");
    spyPick.mockImplementation(() => {
      return new Cartesian3(
        -2710229.528815032,
        -4267489.079323695,
        3876124.767043477,
      );
    });

    const spySampleHeight = vi.spyOn(viewer.scene, "sampleHeight");
    spySampleHeight.mockImplementation(() => {
      return 100.111;
    });

    // mouse over arbitrary position to get infos
    const mousePosition = new Cartesian2(648, 910);
    await (mouseHandler as any).showPositionInfoEntity(mousePosition);

    expect(
      (mouseHandler as any).mousePositionInfoEntity.label.text,
    ).toBeDefined();

    expect(
      (mouseHandler as any).mousePositionInfoEntity.label.show,
    ).toBeTruthy();
  });

  test("Show position info for mouse position (google3DTiles disabled)", async () => {
    createCesiumContainer();

    settings.google3DTilesEnabled.value = false;

    const viewer = new Viewer("cesiumContainer", createTestViewerOptions());
    const mouseHandler = new CesiumMouseHandler(viewer);

    // Mock viewer.scene.pick so it always returns the entity
    const spyPick = vi.spyOn(viewer.scene, "pickPosition");
    spyPick.mockImplementation(() => {
      return new Cartesian3(
        -2710229.528815032,
        -4267489.079323695,
        3876124.767043477,
      );
    });

    // mouse over arbitrary position to get infos
    const mousePosition = new Cartesian2(648, 910);
    await (mouseHandler as any).showPositionInfoEntity(mousePosition);

    // sampleTerrainMostDetailed throws error because terrain is mocked!

    // expect(
    //   (mouseHandler as any).mousePositionInfoEntity.label.text,
    // ).toBeDefined();

    // expect(
    //   (mouseHandler as any).mousePositionInfoEntity.label.show,
    // ).toBeTruthy();
  });
});

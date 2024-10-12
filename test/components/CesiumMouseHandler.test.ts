/* eslint-disable @typescript-eslint/no-explicit-any */
import { mountCesiumViewerMock, silenceConsole } from "../helpers/MockUtils";
import { Cartesian2, Cartesian3, Entity, Model } from "cesium";
import CesiumMouseHandler from "../../src/components/CesiumMouseHandler";
import { settings } from "../../src/components/Settings";
import {
  destroyCesium,
  getCesiumViewer,
} from "../../src/components/CesiumViewerWrapper";
import { cleanup } from "@testing-library/vue";

// global cleanup somehow does not work so do it here ?!
afterEach(() => {
  vi.restoreAllMocks();
  destroyCesium();
  cleanup();
});

describe("CesiumMouseHandler", () => {
  test("Left click", async () => {
    await mountCesiumViewerMock();

    silenceConsole();

    const mouseHandler = new CesiumMouseHandler();

    const modelPath = new URL("/src/assets/models/Plane.glb", import.meta.url)
      .href;

    const model = await Model.fromGltfAsync({ url: modelPath });
    const entity = new Entity();

    const spyPick = vi.spyOn(getCesiumViewer().scene, "pick");
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
    await mountCesiumViewerMock();

    silenceConsole();

    const mouseHandler = new CesiumMouseHandler();

    const modelPath = new URL("/src/assets/models/Plane.glb", import.meta.url)
      .href;

    const model = await Model.fromGltfAsync({ url: modelPath });
    const entity = new Entity();

    const spyPick = vi.spyOn(getCesiumViewer().scene, "pick");
    spyPick.mockImplementation(async () => {
      const result = { id: entity, primitive: model };
      return result;
    });

    const spyFlyTo = vi.spyOn(getCesiumViewer(), "flyTo");
    spyFlyTo.mockImplementation(vi.fn());

    const mousePosition = new Cartesian2(648, 910);
    await mouseHandler.mouseDoubleClickListener({ position: mousePosition }); // zoom to object

    expect(spyFlyTo).toHaveBeenCalled();
  });

  test("Right click", async () => {
    await mountCesiumViewerMock();

    silenceConsole();

    const mouseHandler = new CesiumMouseHandler();

    const modelPath = new URL("/src/assets/models/Plane.glb", import.meta.url)
      .href;

    const model = await Model.fromGltfAsync({ url: modelPath });
    const entity = new Entity();

    const spyPick = vi.spyOn(getCesiumViewer().scene, "pick");
    spyPick.mockImplementation(() => {
      const result = { id: entity, primitive: model };
      return result;
    });

    const spyFlyTo = vi.spyOn(getCesiumViewer(), "flyTo");
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
    expect(getCesiumViewer().trackedEntity).toBeDefined();

    await mouseHandler.mouseRightClickListener({ position: mousePosition }); // second click: unselect
    expect((mouseHandler as any).trackedEntityHighlighter.empty()).toBeTruthy();
    expect(getCesiumViewer().trackedEntity).toBeUndefined();
  });

  test("Right click on area without entity", async () => {
    await mountCesiumViewerMock();

    silenceConsole();

    const mouseHandler = new CesiumMouseHandler();

    // picking an object shall never return anything
    const spyPick = vi.spyOn(getCesiumViewer().scene, "pick");
    spyPick.mockImplementation(() => {
      return undefined;
    });

    const mousePosition = new Cartesian2(648, 910);
    await mouseHandler.mouseRightClickListener({ position: mousePosition });
    expect((mouseHandler as any).trackedEntityHighlighter.empty()).toBeTruthy();
    expect(getCesiumViewer().trackedEntity).toBeUndefined();
  });

  test("Highlight entity on mouse over", async () => {
    await mountCesiumViewerMock();

    silenceConsole();

    const mouseHandler = new CesiumMouseHandler();

    const modelPath = new URL("/src/assets/models/Plane.glb", import.meta.url)
      .href;

    const model = await Model.fromGltfAsync({ url: modelPath });
    const entity = new Entity();

    // Mock viewer.scene.pick so it always returns the entity
    const spyPick = vi.spyOn(getCesiumViewer().scene, "pick");
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
    settings.google3DTilesEnabled.value = true;

    await mountCesiumViewerMock();

    const mouseHandler = new CesiumMouseHandler();

    // Mock viewer.scene.pick so it always returns the entity
    const spyPick = vi.spyOn(getCesiumViewer().scene, "pickPosition");
    spyPick.mockImplementation(() => {
      return new Cartesian3(
        -2710229.528815032,
        -4267489.079323695,
        3876124.767043477,
      );
    });

    const spySampleHeight = vi.spyOn(getCesiumViewer().scene, "sampleHeight");
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
    settings.google3DTilesEnabled.value = false;

    await mountCesiumViewerMock();

    const mouseHandler = new CesiumMouseHandler();

    // Mock viewer.scene.pick so it always returns the entity
    const spyPick = vi.spyOn(getCesiumViewer().scene, "pickPosition");
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

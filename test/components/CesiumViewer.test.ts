/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { enableAutoUnmount, mount } from "@vue/test-utils";
import CesiumViewer, {
  mouseClickListener,
  mouseDoubleClickListener,
  mouseOverListener,
} from "../../src/components/CesiumViewer.vue";
import { createTestViewerOptions } from "../helpers/MockDOMUtils";
import { Entity, Model } from "cesium";
import { createGooglePhotorealistic3DTileset, Cartesian2 } from "cesium";

enableAutoUnmount(afterEach);

describe("CesiumViewer", () => {
  /**
   * Create and mount a CesiumViewer object.
   * @returns {object} wrapper of mounted CesiumViewer
   */
  function mountCesiumViewer() {
    let root = document.getElementById("root");
    while (root?.firstChild) {
      root.removeChild(root.lastChild!);
    }

    if (root) document.body.removeChild(root);

    root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);

    return mount(CesiumViewer, {
      props: {
        mockWebGLFunctionProp: createTestViewerOptions,
        enableGoogle3DTilesProp: false, // stay below cesium quota
      },
      attachTo: root,
    });
  }

  test("Mounting Cesium container", () => {
    mountCesiumViewer();

    // cesium container exists
    expect(
      document.getElementById("cesiumContainer")!.innerHTML,
      "cesiumContainer is empty",
    ).not.toBe(undefined);

    // toolbar exists
    expect(
      document.getElementById("toolbar")!.innerHTML,
      "toolbar is empty",
    ).not.toBe(undefined);
  });

  // Do not test Google Tileset because this increases quota by a lot
  // test("Init Google Tileset", async () => {
  //   mountCesiumViewer();

  //   await initGoogleTileset();
  // });

  test("Toggle Google 3D Tiles", async () => {
    const wrapper = mountCesiumViewer();

    wrapper.vm.setGoogleTileSet(undefined);
    wrapper.vm.googleTilesEnabled = false;
    wrapper.vm.toggleGoogleTiles();

    wrapper.vm.setGoogleTileSet(
      await createGooglePhotorealistic3DTileset(undefined, {
        maximumScreenSpaceError: 10000000000, // high error allowed -> low data quota
      }),
    );
    wrapper.vm.googleTilesEnabled = false;
    wrapper.vm.toggleGoogleTiles();
    expect(wrapper.vm.getViewer().scene.globe.show).toBeTruthy();

    // wrapper.vm.googleTilesEnabled = true;
    // wrapper.vm.toggleGoogleTiles();
    // expect(wrapper.vm.getViewer().scene.globe.show).toBeFalsy();
  });

  test("Click feature", async () => {
    const wrapper = mountCesiumViewer();
    const viewer = wrapper.vm.getViewer();

    const modelPath = new URL("../../assets/models/Plane.glb", import.meta.url)
      .href;

    const model = await Model.fromGltfAsync({ url: modelPath });
    const entity = new Entity();

    const spyPick = vi.spyOn(viewer.scene, "pick");
    spyPick.mockImplementation(() => {
      const result = { id: entity, primitive: model };
      return result;
    });

    const consoleOutput: string[] = [];
    const consoleSpy = vi.spyOn(console, "log");
    consoleSpy.mockImplementation((text) => {
      consoleOutput.push(text);
    });

    const mousePosition = new Cartesian2(648, 910);
    await mouseClickListener({ position: mousePosition }); // first click: select
    expect(consoleOutput.indexOf("Selected entity:")).not.toBe(-1);

    await mouseClickListener({ position: mousePosition }); // second click: unselect
    expect(consoleOutput.indexOf("Unselected entity:")).not.toBe(-1);

    consoleSpy.mockRestore();
  });

  test("Double click feature", async () => {
    const wrapper = mountCesiumViewer();
    const viewer = wrapper.vm.getViewer();

    const modelPath = new URL("../../assets/models/Plane.glb", import.meta.url)
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

    const consoleOutput: string[] = [];
    const consoleSpy = vi.spyOn(console, "log");
    consoleSpy.mockImplementation((text) => {
      consoleOutput.push(text);
    });

    const mousePosition = new Cartesian2(648, 910);
    await mouseDoubleClickListener({ position: mousePosition }); // zoom to object
    expect(consoleOutput.indexOf("Double click on entity:")).not.toBe(-1);

    consoleSpy.mockRestore();
  });

  test("Mouse move", async () => {
    const wrapper = mountCesiumViewer();
    const viewer = wrapper.vm.getViewer();

    const modelPath = new URL("../../assets/models/Plane.glb", import.meta.url)
      .href;

    const model = await Model.fromGltfAsync({ url: modelPath });
    const entity = new Entity();

    const spyPick = vi.spyOn(viewer.scene, "pick");
    spyPick.mockImplementation(() => {
      const result = { id: entity, primitive: model };
      return result;
    });

    let consoleOutput: string[] = [];
    const consoleSpy = vi.spyOn(console, "log");
    consoleSpy.mockImplementation((text) => {
      consoleOutput.push(text);
    });

    // highlight
    const mousePosition = new Cartesian2(648, 910);
    await mouseOverListener({
      endPosition: mousePosition,
      startPosition: new Cartesian2(0, 0),
    });
    expect(consoleOutput.indexOf("Mouse over entity:")).not.toBe(-1);

    consoleOutput = [];

    // picking shall not return anything now
    spyPick.mockImplementation(() => {
      return undefined;
    });

    // unhighlight
    mouseOverListener({
      endPosition: mousePosition,
      startPosition: new Cartesian2(0, 0),
    });
    expect(consoleOutput.length).toBe(0);

    consoleSpy.mockRestore();
  });
});

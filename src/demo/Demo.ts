import { Viewer } from "cesium";
import * as ShipInHamburg from "./ShipInHamburg";
import * as AircraftInSanFrancisco from "./AircraftInSanFrancisco";
import * as VehiclesInUkraine from "./VehiclesInUkraine";
import * as DroneInNewYork from "./DroneInNewYork";

/**
 * Initializes demo functionalities.
 * @param {Viewer} viewer Cesium viewer instance.
 */
export function initDemo(viewer: Viewer) {
  if (!viewer) {
    console.error("Cesium viewer isn't initialized");
    return;
  }

  viewer.entities.add(ShipInHamburg.getEntity());
  viewer.entities.add(AircraftInSanFrancisco.getEntity());
  viewer.entities.add(DroneInNewYork.getEntity());

  for (const entity of VehiclesInUkraine.getEntities()) {
    viewer.entities.add(entity);
  }

  addToolbarMenu([
    new ToolbarOption({ text: "[Demo Menu]", value: "demo-menu" }),
    new ToolbarOption({
      text: ShipInHamburg.text,
      value: ShipInHamburg.value,
      onSelect: () => {
        viewer.camera.flyTo(ShipInHamburg.getCameraPosition());
      },
    }),
    new ToolbarOption({
      text: AircraftInSanFrancisco.text,
      value: AircraftInSanFrancisco.value,
      onSelect: () => {
        viewer.camera.flyTo(AircraftInSanFrancisco.getCameraPosition());
      },
    }),
    new ToolbarOption({
      text: DroneInNewYork.text,
      value: DroneInNewYork.value,
      onSelect: () => {
        viewer.camera.flyTo(DroneInNewYork.getCameraPosition());
      },
    }),
    new ToolbarOption({
      text: VehiclesInUkraine.text,
      value: VehiclesInUkraine.value,
      onSelect: () => {
        viewer.camera.flyTo(VehiclesInUkraine.getCameraPosition());
      },
    }),
  ]);
}

export class ToolbarOption {
  text!: string;
  value!: string;
  onSelect!: () => undefined;

  public constructor(init?: Partial<ToolbarOption>) {
    Object.assign(this, init);
  }
}

/**
 * Adds an option to the toolbar.
 * @param {ToolbarOption[]} options New toolbar option to add
 */
function addToolbarMenu(options: ToolbarOption[]) {
  const menu = document.createElement("select");
  menu.className = "cesium-button";
  menu.id = "demo-entity-selection";

  // if an element was selected reset the selection back to default
  menu.onchange = () => {
    const item = options[menu.selectedIndex];
    if (item && typeof item.onSelect === "function") {
      item.onSelect();

      menu.selectedIndex = 0;
    }
  };

  const toolbar = document.getElementById("demoMenu");
  if (toolbar) {
    toolbar.appendChild(menu);
  } else {
    console.error("No demoMenu element found!");
  }

  for (const option of options) {
    const optionElement = document.createElement("option");
    optionElement.textContent = option.text;
    optionElement.value = option.value;
    menu.appendChild(optionElement);
  }
}

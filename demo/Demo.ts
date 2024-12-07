import * as ShipInHamburg from "./ShipInHamburg";
import * as AircraftInSanFrancisco from "./AircraftInSanFrancisco";
import * as VehiclesInUkraine from "./VehiclesInUkraine";
import * as DroneInNewYork from "./DroneInNewYork";
import { getCesiumViewer } from "@/components/CesiumViewerWrapper";

/**
 * Initializes demo functionalities.
 */
export function initDemo() {
  getCesiumViewer().entities.add(ShipInHamburg.getEntity());
  getCesiumViewer().entities.add(AircraftInSanFrancisco.getEntity());
  getCesiumViewer().entities.add(DroneInNewYork.getEntity());

  for (const entity of VehiclesInUkraine.getEntities()) {
    getCesiumViewer().entities.add(entity);
  }

  addToolbarMenu([
    new ToolbarOption({ text: "[Menu]", value: "demo-menu" }),
    new ToolbarOption({
      text: ShipInHamburg.text,
      value: ShipInHamburg.id,
      onSelect: () => {
        getCesiumViewer().camera.flyTo(ShipInHamburg.getCameraPosition());
      },
    }),
    new ToolbarOption({
      text: AircraftInSanFrancisco.text,
      value: AircraftInSanFrancisco.id,
      onSelect: () => {
        getCesiumViewer().camera.flyTo(
          AircraftInSanFrancisco.getCameraPosition(),
        );
      },
    }),
    new ToolbarOption({
      text: DroneInNewYork.text,
      value: DroneInNewYork.id,
      onSelect: () => {
        getCesiumViewer().camera.flyTo(DroneInNewYork.getCameraPosition());
      },
    }),
    new ToolbarOption({
      text: VehiclesInUkraine.text,
      value: VehiclesInUkraine.id,
      onSelect: () => {
        getCesiumViewer().camera.flyTo(VehiclesInUkraine.getCameraPosition());
      },
    }),
  ]);
}

/**
 * Toolbar option class.
 */
export class ToolbarOption {
  text!: string;
  value!: string;
  onSelect!: () => undefined;

  /**
   * Creates a new toolbar option.
   * @param {Partial<ToolbarOption>} init Toolbar option to use.
   */
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

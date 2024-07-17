import { Viewer } from "cesium";
import * as ShipInHamburg from "./ShipInHamburg";
import * as AircraftInSanFrancisco from "./AircraftInSanFrancisco";
import * as VehiclesInUkraine from "./VehiclesInUkraine";
import * as DroneInNewYork from "./DroneInNewYork";

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
        ShipInHamburg.flyTo(viewer);
      },
    }),
    new ToolbarOption({
      text: AircraftInSanFrancisco.text,
      value: AircraftInSanFrancisco.value,
      onSelect: () => {
        AircraftInSanFrancisco.flyTo(viewer);
      },
    }),
    new ToolbarOption({
      text: DroneInNewYork.text,
      value: DroneInNewYork.value,
      onSelect: () => {
        DroneInNewYork.flyTo(viewer);
      },
    }),
    new ToolbarOption({
      text: VehiclesInUkraine.text,
      value: VehiclesInUkraine.value,
      onSelect: () => {
        VehiclesInUkraine.flyTo(viewer);
      },
    }),
  ]);
}

class ToolbarOption {
  text!: string;
  value!: string;
  onSelect!: () => undefined;

  public constructor(init?: Partial<ToolbarOption>) {
    Object.assign(this, init);
  }
}

function addToolbarMenu(options: ToolbarOption[]) {
  const menu = document.createElement("select");
  menu.className = "cesium-button";

  menu.onchange = function () {
    // reset();
    const item = options[menu.selectedIndex];
    if (item && typeof item.onSelect === "function") {
      item.onSelect();

      // reset back to default
      menu.selectedIndex = 0;
    }
  };

  const toolbar = document.getElementById("toolbar");
  if (toolbar) {
    toolbar.appendChild(menu);
  } else {
    console.error("No toolbar element found!");
  }

  for (const option of options) {
    const optionElement = document.createElement("option");
    optionElement.textContent = option.text;
    optionElement.value = option.value;
    menu.appendChild(optionElement);
  }
}

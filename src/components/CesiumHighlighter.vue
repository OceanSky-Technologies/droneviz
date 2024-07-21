<script lang="ts">
import {
  Color,
  ColorBlendMode,
  ConstantProperty,
  defined,
  Entity,
  JulianDate,
  ModelGraphics,
  Scene,
} from "cesium";
import { almostEqual } from "../helpers/FuzzyCompare";

interface Silhouette {
  color: Color;
  size: number;
}

export default class CesiumHighlighter {
  constructor(scene: Scene, color: Color, silhouette?: Silhouette) {
    if (!scene) throw Error("Invalid scene");
    if (!color) throw Error("Invalid color");

    if (color.red > 1.0) throw new Error("Red must be 0<=x<=1");
    if (color.green > 1.0) throw new Error("Green must be 0<=x<=1");
    if (color.blue > 1.0) throw new Error("Blue must be 0<=x<=1");
    if (color.alpha > 1.0) throw new Error("Alpha must be 0<=x<=1");

    if (silhouette) {
      if (silhouette.color.red > 1.0)
        throw new Error("Silhouette red must be 0<=x<=1");
      if (silhouette.color.green > 1.0)
        throw new Error("Silhouette green must be 0<=x<=1");
      if (silhouette.color.blue > 1.0)
        throw new Error("Silhouette blue must be 0<=x<=1");
      if (silhouette.color.alpha > 1.0)
        throw new Error("Silhouette alpha must be 0<=x<=1");
    }

    this.scene = scene;
    this.color = color;
    this.silhouette = silhouette;
  }

  contains(entity: Entity) {
    if (!defined(entity)) throw Error("Invalid entity");

    return this.getEntityIds().includes(entity.id);
  }

  add(entity: any) {
    if (!defined(entity)) throw Error("Invalid entity");

    if (!this.contains(entity)) {
      this.entities.push(entity);

      if (defined(entity.id.model)) {
        this.addColor(entity.id.model);
        this.setSilhouette(entity.id.model, true);
      }

      this.scene.requestRender();
    }
  }

  setArray(entities: any[]) {
    if (!defined(entities)) throw Error("Invalid entity array");

    const currentEntityIds = this.getEntityIds();

    for (const entity of entities) {
      // check if the entity has already been colorized
      if (!currentEntityIds.includes(entity.id))
        if (defined(entity.id.model)) {
          this.addColor(entity.id.model);
          this.setSilhouette(entity.id.model, true);
        }
    }

    this.entities = entities;

    this.scene.requestRender();
  }

  remove(entity: any) {
    if (!defined(entity)) throw Error("Invalid entity");

    const index = this.getEntityIds().indexOf(entity.id);

    if (index != -1) {
      this.entities.splice(index, 1);
      if (defined(entity.id.model)) {
        this.removeColor(entity.id.model);
        this.setSilhouette(entity.id.model, false);
      }
    }
  }

  clear() {
    for (const entity of this.entities) {
      if (defined(entity.id) && defined(entity.id.model))
        this.removeColor(entity.id.model);
      this.setSilhouette(entity.id.model, false);
    }

    this.entities = [];
  }

  getEntities(): Entity[] {
    return this.entities;
  }

  getEntityIds(): string[] {
    const entityIds: string[] = [];
    for (const storedEntity of this.entities) entityIds.push(storedEntity.id);

    return entityIds;
  }

  empty(): boolean {
    return this.entities.length == 0;
  }

  private setSilhouette(model: ModelGraphics, enable: boolean) {
    if (this.silhouette) {
      if (enable) {
        model.silhouetteColor = new ConstantProperty(this.silhouette.color);
        model.silhouetteSize = new ConstantProperty(this.silhouette.size);
      } else {
        model.silhouetteColor = undefined;
        model.silhouetteSize = undefined;
      }
    }
  }

  private addColor(model: ModelGraphics) {
    if (defined(model)) {
      if (defined(model.color)) {
        const originalColor = model.color.getValue(new JulianDate());
        if (originalColor) {
          let tmpColor: Color = new Color();
          Color.add(originalColor, this.color, tmpColor);

          // clamp values
          if (tmpColor.red > 1) tmpColor.red = 1;
          if (tmpColor.green > 1) tmpColor.green = 1;
          if (tmpColor.blue > 1) tmpColor.blue = 1;
          if (tmpColor.alpha > 1) tmpColor.alpha = 1;

          model.color = new ConstantProperty(tmpColor);
        } else {
          model.color = new ConstantProperty(this.color);
        }
      } else {
        model.color = new ConstantProperty(this.color);
      }
      model.colorBlendMode = new ConstantProperty(ColorBlendMode.HIGHLIGHT);
      model.colorBlendAmount = new ConstantProperty(1.0);
    } else console.warn("Entity has no model");
  }

  private removeColor(model: ModelGraphics) {
    if (defined(model)) {
      if (defined(model.color)) {
        let tmpColor: Color = model.color.getValue(new JulianDate());
        Color.subtract(tmpColor, this.color, tmpColor);

        // clamp values
        if (tmpColor.red < 0) tmpColor.red = 0;
        if (tmpColor.green < 0) tmpColor.green = 0;
        if (tmpColor.blue < 0) tmpColor.blue = 0;
        tmpColor.alpha = 1;

        if (
          almostEqual(tmpColor.red, 0.0) &&
          almostEqual(tmpColor.green, 0.0) &&
          almostEqual(tmpColor.blue, 0.0)
        ) {
          model.color = undefined;
          model.colorBlendMode = undefined;
          model.colorBlendAmount = undefined;
        } else {
          model.color = new ConstantProperty(tmpColor);
          model.colorBlendMode = new ConstantProperty(ColorBlendMode.HIGHLIGHT);
          model.colorBlendAmount = new ConstantProperty(1.0);
        }
      }
    } else console.warn("Entity has no model");
  }

  private readonly scene: Scene;
  private readonly color: Color;
  private readonly silhouette: Silhouette | undefined;
  private entities: any[] = [];
}
</script>

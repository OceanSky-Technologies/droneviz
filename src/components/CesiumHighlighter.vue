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

export interface Silhouette {
  color: Color;
  size: number;
}

/**
 * Highlights cesium entities.
 */
export default class CesiumHighlighter {
  /**
   * Creates a new object from a set of parameters.
   * @param {Scene} scene Cesium scene.
   * @param {Color} color Optional color to apply.
   * @param {Silhouette} silhouette Optional silhouette to apply.
   */
  constructor(scene: Scene, color?: Color, silhouette?: Silhouette) {
    if (!scene) throw Error("Invalid scene");

    if (color) {
      if (color.red > 1.0 || color.red < 0.0)
        throw new Error("Red must be 0<=x<=1");
      if (color.green > 1.0 || color.green < 0.0)
        throw new Error("Green must be 0<=x<=1");
      if (color.blue > 1.0 || color.blue < 0.0)
        throw new Error("Blue must be 0<=x<=1");
      if (color.alpha > 1.0 || color.alpha < 0.0)
        throw new Error("Alpha must be 0<=x<=1");
    }

    if (silhouette) {
      if (silhouette.color.red > 1.0 || silhouette.color.red < 0.0)
        throw new Error("Silhouette red must be 0<=x<=1");
      if (silhouette.color.green > 1.0 || silhouette.color.green < 0.0)
        throw new Error("Silhouette green must be 0<=x<=1");
      if (silhouette.color.blue > 1.0 || silhouette.color.blue < 0.0)
        throw new Error("Silhouette blue must be 0<=x<=1");
      if (silhouette.color.alpha > 1.0 || silhouette.color.alpha < 0.0)
        throw new Error("Silhouette alpha must be 0<=x<=1");
      if (silhouette.size < 0.0) throw new Error("Silhouette size must be >=0");
    }

    this.scene = scene;
    this.color = color;
    this.silhouette = silhouette;
  }

  /**
   * Check if a given entity is already highlighted by this CesiumHighlighter.
   * @param {Entity} entity Entity to check.
   * @returns {boolean} true if the entity was already added, false otherwise.
   */
  contains(entity: Entity): boolean {
    if (!defined(entity)) throw Error("Invalid entity");

    return this.getEntityIds().includes(entity.id);
  }

  /**
   * Adds a new entity to be highlighted.
   * @param {any} entity New entity to highlight.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  add(entity: any) {
    if (!defined(entity)) throw Error("Invalid entity");

    if (!this.contains(entity)) {
      this.entities.push(entity);

      if (defined(entity.id.model)) {
        this.addColor(entity.id.model);
        this.addSilhouette(entity.id.model);
      }

      this.scene.requestRender();
    }
  }
  /**
   * Adds new entities to be highlighted.
   * @param {any} entities New entitites to highlight.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setArray(entities: any[]) {
    if (!defined(entities)) throw Error("Invalid entity array");

    const currentEntityIds = this.getEntityIds();

    for (const entity of entities) {
      // check if the entity has already been colorized
      if (!currentEntityIds.includes(entity.id))
        if (defined(entity.id.model)) {
          this.addColor(entity.id.model);
          this.addSilhouette(entity.id.model);
        }
    }

    this.entities = entities;

    this.scene.requestRender();
  }
  /**
   * Removes an entity from the highlighter.
   * @param {any} entity Entity that shall not be highlighted anymore.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  remove(entity: any) {
    if (!defined(entity)) throw Error("Invalid entity");

    const index = this.getEntityIds().indexOf(entity.id);

    if (index != -1) {
      this.entities.splice(index, 1);
      if (defined(entity.id.model)) {
        this.removeColor(entity.id.model);
        this.removeSilhouette(entity.id.model);
      }
    }
  }

  /**
   * Remove all entities from this highlighter so they aren't highlighted anymore.
   */
  clear() {
    for (const entity of this.entities) {
      if (defined(entity.id) && defined(entity.id.model)) {
        this.removeColor(entity.id.model);
        this.removeSilhouette(entity.id.model);
      }
    }

    this.entities = [];
  }

  /**
   * Gets the list of all entities that are being highlighted.
   * @returns {Entity[]} Array of entities that are highlighted.
   */
  getEntities(): Entity[] {
    return this.entities;
  }

  /**
   * Gets the list of all entity IDs that are being highlighted.
   * @returns {string[]} Array of entity IDs that are highlighted.
   */
  getEntityIds(): string[] {
    const entityIds: string[] = [];
    for (const storedEntity of this.entities) entityIds.push(storedEntity.id);

    return entityIds;
  }

  /**
   * Checks if one or more entities are highlighted.
   * @returns {boolean} true if one or more entities are highlighted, false if not.
   */
  empty(): boolean {
    return this.entities.length == 0;
  }

  /**
   * Enables the silhouette for a given model.
   * @param {ModelGraphics} model Model for which the silhouette shall be enabled.
   */
  private addSilhouette(model: ModelGraphics) {
    if (this.silhouette) {
      model.silhouetteColor = new ConstantProperty(this.silhouette.color);
      model.silhouetteSize = new ConstantProperty(this.silhouette.size);
    }
  }

  /**
   * Disables the silhouette for a given model.
   * @param {ModelGraphics} model Model for which the silhouette shall be disabled.
   */
  private removeSilhouette(model: ModelGraphics) {
    if (this.silhouette) {
      model.silhouetteColor = undefined;
      model.silhouetteSize = undefined;
    }
  }

  /**
   * Enables the color for a given model.
   * @param {ModelGraphics} model Model for which the color shall be enabled.
   */
  private addColor(model: ModelGraphics) {
    if (!this.color) return;

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

  /**
   * Disables the color for a given model.
   * @param {ModelGraphics} model Model for which the color shall be disabled.
   */
  private removeColor(model: ModelGraphics) {
    if (!this.color) return;

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
  private readonly color: Color | undefined;
  private readonly silhouette: Silhouette | undefined;

  // List of all entities that are highlighted.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private entities: any[] = [];
}
</script>

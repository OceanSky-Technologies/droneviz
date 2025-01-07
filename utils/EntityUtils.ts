// Idenfities the preferred entity from a list of entities.
// First prio:
// - Drones / entities that don't start with "ego-" or "mouse-position-info"
// Second prio:
// - Entities that don't have the id "mouse-position-info"
//
// Entities with the id "mouse-position-info" are ignored.
// @param entities List of entities
export function getPreferredEntity(entities: any[]): any | undefined {
  if (!entities || entities.length === 0) {
    return undefined;
  }

  // first prio: entities that don't start with "ego-" or "mouse-position-info"
  const firstPrioEntities: any[] = [];

  // second prio: entities that are not "mouse-position-info"
  const secondPrioEntities: any[] = [];

  for (const entity of entities) {
    if (!entity || !entity.id || !entity.id.id) {
      continue;
    }

    if (
      !entity.id.id.startsWith("ego-") &&
      entity.id.id !== "mouse-position-info"
    ) {
      firstPrioEntities.push(entity);
      continue;
    }

    if (entity.id.id !== "mouse-position-info") {
      secondPrioEntities.push(entity);
      continue;
    }
  }

  if (firstPrioEntities.length > 0) {
    return firstPrioEntities[0];
  }

  if (secondPrioEntities.length > 0) {
    return secondPrioEntities[0];
  }

  return undefined;
}

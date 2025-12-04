import { items, groups } from "./timeline.js";
import { options } from "./timelineConfig.js";
import { restoreItems, restoreGroups, restoreOptions } from "./timelineStorage.js";
import { attachPersistenceListeners } from "../timelinePersistence.js";

export function initTimeline() {
  // Restaurer depuis localStorage
  restoreItems(items);
  restoreGroups(groups);
  restoreOptions(options);

  // Créer la timeline
  const container = document.getElementById("timeline");
  if (!container) {
    console.error("❌ Élément #timeline introuvable");
    return null;
  }

  const timeline = new vis.Timeline(container, items, groups, options);

  // Attacher la persistance automatique
  attachPersistenceListeners(items, groups, timeline);

  // Retourner l’instance pour l’utiliser ailleurs
  return timeline;
}

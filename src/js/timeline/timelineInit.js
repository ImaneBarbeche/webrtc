import { items, groups } from "./timeline.js";
import { options } from "./timelineConfig.js";
import { restoreItems, restoreGroups, restoreOptions } from "./timelineStorage.js";
import { attachPersistenceListeners } from "./timelinePersistence.js";

// Garde pour eviter la double initialisation
let _timelineInstance = null;

export function initTimeline() {
  // Eviter la double initialisation
  if (_timelineInstance) {
    console.warn("Timeline deja initialisee, retour de l'instance existante");
    return _timelineInstance;
  }

  // Restaurer depuis localStorage
  restoreItems(items);
  restoreGroups(groups);
  restoreOptions(options);

  // Creer la timeline
  const container = document.getElementById("timeline");
  if (!container) {
    console.error("Element #timeline introuvable");
    return null;
  }

  const timeline = new vis.Timeline(container, items, groups, options);
  _timelineInstance = timeline;

  // Attacher la persistance automatique
  attachPersistenceListeners(items, groups, timeline);

  // Retourner l'instance pour l'utiliser ailleurs
  return timeline;
}

import { persistItems, persistGroups, persistOptions } from "./timelineStorage.js";

let _persistenceAttached = false;

/**
 * Attache des listeners sur items et groups pour persister automatiquement
 * les changements dans localStorage, avec un petit debounce.
 * Les options sont persistées via la timeline.
 */
export function attachPersistenceListeners(items, groups, timeline) {
  if (_persistenceAttached) return;

  try {
    // Debounce commun pour éviter les écritures trop fréquentes
    let debounceTimer = null;
    const persistDebounced = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          persistItems(items);
          persistGroups(groups);
          persistOptions(timeline);
        } catch (e) {
          console.warn("[LifeStories] persistence failed", e);
        }
      }, 150);
    };

    // Attacher les listeners sur items
    if (items && typeof items.on === "function") {
      items.on("add", persistDebounced);
      items.on("update", persistDebounced);
      items.on("remove", persistDebounced);
    }

    // Attacher les listeners sur groups
    if (groups && typeof groups.on === "function") {
      groups.on("update", persistDebounced);
    }

    // Persister aussi quand les options changent
    if (timeline && typeof timeline.on === "function") {
      timeline.on("changed", persistDebounced);
    }

    _persistenceAttached = true;
  } catch (e) {
    console.warn("[LifeStories] failed to attach persistence listeners", e);
  }
}

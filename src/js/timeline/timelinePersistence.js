import { persistItems, persistGroups, persistOptions } from "../timeline/timelineStorage.js";

let _persistenceAttached = false;

/**
 * Attach listeners on items and groups to automatically persist
 * changes to localStorage, with a small debounce.
 * Options are persisted via the timeline.
 */
export function attachPersistenceListeners(items, groups, timeline) {
  if (_persistenceAttached) return;

  try {
    // Common debounce to avoid too frequent writes
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

    // Attach listeners on items
    if (items && typeof items.on === "function") {
      items.on("add", persistDebounced);
      items.on("update", persistDebounced);
      items.on("remove", persistDebounced);
    }

    // Attach listeners on groups
    if (groups && typeof groups.on === "function") {
      groups.on("update", persistDebounced);
    }

    // Also persist when options change
    if (timeline && typeof timeline.on === "function") {
      timeline.on("changed", persistDebounced);
    }

    _persistenceAttached = true;
  } catch (e) {
    console.warn("[LifeStories] failed to attach persistence listeners", e);
  }
}

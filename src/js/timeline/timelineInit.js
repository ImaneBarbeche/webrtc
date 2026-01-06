import { items, groups } from "./timeline.js";
import { options } from "./timelineConfig.js";
import {
  restoreItems,
  restoreGroups,
  restoreOptions,
} from "./timelineStorage.js";
import { attachPersistenceListeners } from "./timelinePersistence.js";
import {
  detectGaps,
  createGapItems,
  updateGapsInTimeline,
} from "./gapDetection.js";

// Guard to prevent double initialization
let _timelineInstance = null;

export function initTimeline() {
  // Avoid double initialization
  if (_timelineInstance) {
    console.warn("Timeline already initialized, returning existing instance");
    return _timelineInstance;
  }

  // Restore from localStorage
  restoreItems(items);
  // Clean up old restored gaps to avoid duplicate IDs
  try {
    const restoredGaps = items.get().filter((it) => String(it.id).startsWith("gap-"));
    if (restoredGaps.length > 0) {
      const idsToRemove = restoredGaps.map((g) => g.id);
      items.remove(idsToRemove);
    }
  } catch (e) {
    console.warn('Error cleaning up restored gaps', e);
  }
  restoreGroups(groups);
  restoreOptions(options);

  // Set editable based on role (respondent = viewer) stored in sessionStorage
  try {
    const isViewer = sessionStorage.getItem("webrtc_isOfferor") === "false";
    // If isViewer true -> user is respondent -> disable editing
    options.editable = !isViewer;
  } catch (e) {}

  // Create the timeline
  const container = document.getElementById("timeline");
  if (!container) {
    console.error("Element #timeline not found");
    return null;
  }

  const timeline = new vis.Timeline(container, items, groups, options);
  _timelineInstance = timeline;

  // Ensure that when LifeStories is displayed (after onboarding),
  // the editable option is updated based on the current role.
  document.addEventListener("lifestoriesShown", () => {
    try {
      const isViewer = sessionStorage.getItem("webrtc_isOfferor") === "false";
      timeline.setOptions({ editable: !isViewer });
      try { timeline.redraw(); } catch (e) {}
    } catch (e) {}
  });

  // Attach automatic persistence
  attachPersistenceListeners(items, groups, timeline);

  // 1. Retrieve episodes
  const episodes = items.get();

  // 2. Detect gaps (respect the `showGaps` flags of groups)
  const gaps = detectGaps(episodes, groups);

  // 3. Create visual items
  const gapItems = createGapItems(gaps);

  // 4. Add to timeline
  items.add(gapItems);

  // After timeline creation, add listeners:
  items.on("add", () => updateGapsInTimeline(items, groups));
  items.on("update", () => updateGapsInTimeline(items, groups));
  items.on("remove", () => updateGapsInTimeline(items, groups));

  // Return the instance for use elsewhere
  return timeline;
}

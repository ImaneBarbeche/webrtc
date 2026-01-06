// landmarkUtils.js

// Long press handling for landmarks (subgroup labels)
// Detects a long press on a subgroup label to activate/deactivate the landmark.

const LONG_PRESS_DURATION = 500; // ms to trigger long press
const LONG_PRESS_MOVE_THRESHOLD = 5; // px tolerance before cancellation

export function setupLongPressHandlers(timeline, groups, utils) {
  let longPressTimer = null;
  let longPressTarget = null;
  let longPressStartPos = null;

  // Start long press detection on group labels
  timeline.on("mouseDown", (properties) => {
    if (properties.what !== "group-label" || !properties.group) return;

    const clickedGroup = groups.get(properties.group);
    // Only for subgroups
    if (!clickedGroup || !clickedGroup.nestedInGroup) return;

    longPressTarget = properties.group;
    longPressStartPos = {
      x: properties.event?.clientX ?? 0,
      y: properties.event?.clientY ?? 0,
    };

    // Start long press timer
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
      toggleLandmark(longPressTarget, groups, utils);
      longPressTarget = null;
      longPressStartPos = null;
    }, LONG_PRESS_DURATION);
  });

  // Cancel if movement too large during press
  timeline.on("mouseMove", (properties) => {
    if (!longPressTimer || !longPressStartPos || !properties.event) return;

    const dx = Math.abs(properties.event.clientX - longPressStartPos.x);
    const dy = Math.abs(properties.event.clientY - longPressStartPos.y);
    if (dx > LONG_PRESS_MOVE_THRESHOLD || dy > LONG_PRESS_MOVE_THRESHOLD) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      longPressStartPos = null;
      longPressTarget = null;
    }
  });

  // Cancel at end of press
  timeline.on("mouseUp", () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      longPressStartPos = null;
      longPressTarget = null;
    }
  });
}

/**
 * Activates certain subgroups as landmarks on startup.
 * Updates the parent to track its landmark children.
 */
export function activateInitialLandmarks(groups) {
  const initialLandmarks = [13, 23, 31];

  // Persistence: key to store a mapping parentId -> landmarkId
  const LANDMARKS_STORAGE_KEY = "landmarksByParent";

  function loadLandmarksByParent() {
    try {
      const raw = localStorage.getItem(LANDMARKS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // Try to restore from localStorage (one per parent)
  const stored = loadLandmarksByParent();
  if (stored && typeof stored === "object") {
    Object.entries(stored).forEach(([parentIdStr, childId]) => {
      const parentId = Number(parentIdStr);
      const g = groups.get(childId);
      if (!g) return;
      if (g.nestedInGroup !== parentId) return;

      // Activate landmark on the subgroup
      g.isLandmark = true;
      groups.update(g);

      // Update the parent
      const parent = groups.get(parentId);
      if (!parent) return;
      parent.landmarkChildren = [childId];
      groups.update(parent);
    });
  } else {
    // Ensure activating at most one landmark per parent (take the first found)
    const seenParents = new Set();
    initialLandmarks.forEach((id) => {
      const g = groups.get(id);
      if (!g) return;
      const parentId = g.nestedInGroup || null;
      if (!parentId) return;
      if (seenParents.has(parentId)) return; // already one activated for this parent

      // Activate landmark on the subgroup
      g.isLandmark = true;
      groups.update(g);

      // Update the parent
      const parent = groups.get(parentId);
      if (!parent) return;

      parent.landmarkChildren = parent.landmarkChildren || [];
      if (!parent.landmarkChildren.includes(id)) {
        parent.landmarkChildren.push(id);
      }
      groups.update(parent);

      seenParents.add(parentId);
    });
  }

  // Initial save to localStorage if no save exists
  try {
    if (!localStorage.getItem("lifestories_groups")) {
      localStorage.setItem("lifestories_groups", JSON.stringify(groups.get()));
    }
  } catch {
    // silent fail if storage unavailable (e.g. strict private mode)
  }

  // Re-transform Lucide icons
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  // Listener to synchronize between tabs (applies stored map)
  try {
    window.addEventListener("storage", (e) => {
      if (e.key !== LANDMARKS_STORAGE_KEY) return;
      let raw = null;
      try {
        raw = localStorage.getItem(LANDMARKS_STORAGE_KEY);
        raw = raw ? JSON.parse(raw) : null;
      } catch {
        raw = null;
      }
      if (!raw) return;

      Object.entries(raw).forEach(([pIdStr, childId]) => {
        const pId = Number(pIdStr);
        const g = groups.get(childId);
        if (!g) return;
        if (g.nestedInGroup !== pId) return;
        deactivateSiblingLandmarks(groups, pId, childId);
        g.isLandmark = true;
        groups.update(g);
        const parent = groups.get(pId);
        if (parent) {
          parent.landmarkChildren = [childId];
          groups.update(parent);
        }
      });

      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    });
  } catch {
    // ignore if window/storage inaccessible
  }
}

/**
 * Deactivates all sibling landmarks (same children of same parent), except `exceptId`.
 */
function deactivateSiblingLandmarks(groups, parentId, exceptId = null) {
  if (!parentId) return;

  const parent = groups.get(parentId);
  const all = groups.get();
  all.forEach((g) => {
    if (g.nestedInGroup === parentId && g.id !== exceptId && g.isLandmark) {
      g.isLandmark = false;
      groups.update(g);
    }
  });

  if (parent) {
    parent.landmarkChildren = (parent.landmarkChildren || []).filter((id) => id === exceptId);
    groups.update(parent);
  }
}

// Helpers to persist the map parent -> activeLandmark
const LANDMARKS_STORAGE_KEY = "landmarksByParent";

function saveLandmarksByParent(groups) {
  try {
    const map = {};
    const all = groups.get();
    all.forEach((g) => {
      if (g.isLandmark && g.nestedInGroup) {
        map[g.nestedInGroup] = g.id;
      }
    });
    localStorage.setItem(LANDMARKS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

function loadLandmarksByParent() {
  try {
    const raw = localStorage.getItem(LANDMARKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Toggle landmark status of a subgroup and maintain parent's landmarkChildren list.
 */
export function toggleLandmark(groupId, groups, utils) {
  const group = groups.get(groupId);
  if (!group) {
    console.warn("Group not found for toggleLandmark:", groupId);
    return;
  }

  // Check that it's a subgroup
  const parentId = group.nestedInGroup;
  if (!parentId) {
    console.warn("This group is not a subgroup, toggleLandmark ignored:", groupId);
    return;
  }

  const parentGroup = groups.get(parentId);
  if (!parentGroup) {
    console.warn("Parent not found for group:", groupId);
    return;
  }

  // Toggle landmark status
  const isCurrentlyLandmark = Boolean(group.isLandmark);

  // If activating, deactivate other subgroups of same parent
  if (!isCurrentlyLandmark) {
    deactivateSiblingLandmarks(groups, parentId, groupId);
  }

  group.isLandmark = !isCurrentlyLandmark;

  // Maintain list of parent's landmark children (only one allowed)
  parentGroup.landmarkChildren = parentGroup.landmarkChildren || [];
  if (group.isLandmark) {
    parentGroup.landmarkChildren = [groupId];
  } else {
    parentGroup.landmarkChildren = parentGroup.landmarkChildren.filter((id) => id !== groupId);
  }

  // Update groups
  groups.update(group);
  groups.update(parentGroup);

  // Persist landmark state by parent
  try {
    saveLandmarksByParent(groups);
  } catch {
    // ignore
  }

  // Re-transform Lucide icons
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  // Visual feedback (optional)
  if (utils && typeof utils.prettyAlert === "function") {
    utils.prettyAlert(
      group.isLandmark ? "Landmark activé" : "Landmark désactivé",
      `${group.contentText || "Ce sous-groupe"} ${
        group.isLandmark ? "restera visible" : "ne sera plus visible"
      } quand le groupe est fermé`,
      "success",
      1500
    );
  } else {
    // Subtle fallback in console if no feedback UI
    console.log(
      `[Landmark] ${group.contentText || groupId}:`,
      group.isLandmark ? "activé" : "désactivé"
    );
  }
}

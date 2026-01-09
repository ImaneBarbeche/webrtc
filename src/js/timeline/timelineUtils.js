// timelineUtils.js

export function renderGroupLabel(group) {
  if (!group) return "";

  // Icons for all groups
  const icons = {
    // Root groups
    1: "map-pin-house",
    2: "contact",
    3: "school",
    4: "briefcase",
    // Nested groups (Migratoire)
    11: "key-round", // Residential status
    12: "house", // Housing
    13: "map-pinned", // Municipality

    // Nested groups (Familiale)
    21: "users", // House members
    22: "baby", // Children
    23: "book-heart", // Marital status

    // Nested groups (Scolaire)
    31: "building-2", // Establishments
    32: "book-marked", // Training

    // Nested groups (Professionnelle)
    41: "factory", // industry
    42: "file-text", // profession
    43: "id-card-lanyard", // employement status
    44: "map-plus", // place of activity
  };

  let iconHtml = icons[group.id]
    ? `<i data-lucide="${icons[group.id]}"></i> `
    : "";

  if (group.isLandmark) {
    iconHtml += '<i data-lucide="pin" class="lucide landmark-pin"></i> ';
  }

  return iconHtml + (group.contentText || "");
}

export function scheduleRedraw(timeline) {
  if (!timeline) return;
  // Use requestAnimationFrame for fluid redraw
  requestAnimationFrame(() => {
    try {
      timeline.redraw();
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    } catch (e) {
      console.warn("[LifeStories] redraw failed", e);
    }
  });
}

/**
 * Check if an item is within the selected time range
 */
export function isItemInRange(item, snappedTime) {
  if (!item) return false;

  if (item.type === "point" || item.type === "box") {
    const itemYear = new Date(item.start).getFullYear();
    const barYear = new Date(snappedTime).getFullYear();
    return itemYear === barYear;
  } else {
    const itemStart = new Date(item.start).getTime();
    const itemEnd = item.end ? new Date(item.end).getTime() : itemStart;
    return snappedTime >= itemStart && snappedTime < itemEnd;
  }
}

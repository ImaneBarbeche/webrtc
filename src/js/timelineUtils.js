// timelineUtils.js

export function renderGroupLabel(group) {
  if (!group) return "";

  const icons = {
    1: "house",
    2: "school",
    3: "briefcase",
  };

  let iconHtml = icons[group.id] ? `<i data-lucide="${icons[group.id]}"></i> ` : "";

  if (group.isLandmark) {
    iconHtml += '<i data-lucide="pin" class="lucide landmark-pin"></i> ';
  }

  return iconHtml + (group.contentText || "");
}

export function scheduleRedraw(timeline) {
  if (!timeline) return;
  // Utilise requestAnimationFrame pour un redraw fluide
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
 * Vérifie si un item est dans la plage de temps sélectionnée
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

// timelineInteractions.js
import { items, groups } from "./timeline.js";
import { openEpisodeEditModal } from "./episodeEdit.js";
import { setupLongPressHandlers } from "./landmarkUtils.js";
import { timelineState } from "./timelineState.js";

/**
 * Initialise toutes les interactions utilisateur (clics, long press, landmarks…)
 */
export function setupInteractions(timeline, utils) {
  let longPressTimer = null;
  let longPressStartPos = null;
  let longPressTargetItem = null;
  const LONG_PRESS_DURATION = 500;
  const LONG_PRESS_MOVE_THRESHOLD = 5;

  // Gestion appui long sur items
  timeline.on("mouseDown", (properties) => {
    if (properties.what === "item" && properties.item) {
      longPressTargetItem = properties.item;
      longPressStartPos = {
        x: properties.event.clientX,
        y: properties.event.clientY,
      };
      longPressTimer = setTimeout(() => {
        timelineState.isEditingEpisode = true;
        const item = items.get(longPressTargetItem);
        openEpisodeEditModal(item, (updatedItem) => {
          items.update(updatedItem);
          setTimeout(() => timeline.redraw(), 0);
          timelineState.isEditingEpisode = false;
        });
        longPressTargetItem = null;
        longPressStartPos = null;
      }, LONG_PRESS_DURATION);
    }
  });

  timeline.on("mouseMove", (properties) => {
    if (longPressTimer && longPressStartPos && properties.event) {
      const dx = Math.abs(properties.event.clientX - longPressStartPos.x);
      const dy = Math.abs(properties.event.clientY - longPressStartPos.y);
      if (dx > LONG_PRESS_MOVE_THRESHOLD || dy > LONG_PRESS_MOVE_THRESHOLD) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
        longPressStartPos = null;
      }
    }
  });

  timeline.on("mouseUp", () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      longPressStartPos = null;
    }
  });

  // Gestion appui long sur labels de groupes
  setupLongPressHandlers(timeline, groups, utils);

  // Gestion clics (axe temporel, labels de groupes)
  timeline.on("click", (properties) => {
    if (properties.what === "axis" && properties.time) {
      const clickedTime = new Date(properties.time);
      const yearStart = new Date(clickedTime.getFullYear(), 0, 1);
      timeline.setCustomTime(yearStart, timelineState.customTimeId);
      timeline.emit("timechange", {
        id: timelineState.customTimeId,
        time: yearStart,
      });
      timeline.setCustomTimeTitle(yearStart.getFullYear(), "custom-bar");

      // Mettre à jour synthèse et âge aussi au clic
      renderSummary(yearStart.getTime());
      renderYearAndAge(yearStart.getTime());

      return;
    }

    if (properties.what === "group-label" && properties.group) {
      const clickedGroup = groups.get(properties.group);

      if (
        timelineState.longPressTarget === null &&
        clickedGroup?.nestedInGroup
      ) {
        timelineState.longPressTarget = undefined;
        return;
      }
      timelineState.longPressTarget = undefined;

      if (clickedGroup?.landmarkChildren?.length > 0) {
        setTimeout(() => {
          const updatedGroup = groups.get(properties.group);
          const isClosed = !updatedGroup.showNested;

          updatedGroup.landmarkChildren.forEach((landmarkId) => {
            let landmarkItems;
            if (isClosed) {
              landmarkItems = items.get({
                filter: (item) => item.group === landmarkId,
              });
            } else {
              landmarkItems = items.get({
                filter: (item) =>
                  item.group === properties.group &&
                  item.__originalGroup === landmarkId,
              });
            }

            landmarkItems.forEach((item) => {
              if (isClosed) {
                item._originalGroup = item.group;
                item.group = properties.group;
              } else if (item._originalGroup) {
                item.group = item._originalGroup;
                delete item._originalGroup;
              }
              items.update(item);
            });
          });

          if (window.lucide?.createIcons) window.lucide.createIcons();
        }, 50);
      } else {
        setTimeout(() => {
          if (window.lucide?.createIcons) window.lucide.createIcons();
        }, 50);
      }
    }
  });
}

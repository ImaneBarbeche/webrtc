// timelineInteractions.js
import { items, groups } from "./timeline.js";
import { openEpisodeEditModal } from "../episodes/episodeEdit.js";
import { setupLongPressHandlers } from "./landmarkUtils.js";
import { timelineState } from "./timelineState.js";

/**
 * Initialize all user interactions (clicks, long press, landmarks…)
 */
export function setupInteractions(timeline, utils) {
  let longPressTimer = null;
  let longPressStartPos = null;
  let longPressTargetItem = null;
  const LONG_PRESS_DURATION = 500;
  const LONG_PRESS_MOVE_THRESHOLD = 5;

  // Handle long press on items
  timeline.on("mouseDown", (properties) => {
    if (properties.what === "item" && properties.item) {
      // Prevent long press edit if user is not WebRTC host
      try {
        if (
          window.webrtcSync &&
          typeof window.webrtcSync.isActive === "function" &&
          window.webrtcSync.isActive() &&
          typeof window.webrtcSync.getRole === "function"
        ) {
          const role = window.webrtcSync.getRole();
          if (role !== "host") {
            // Guest/respondent: don't activate long-press to open modal
            return;
          }
        }
      } catch (e) {
        // In case of error, use default behavior (don't block)
        console.warn('Error checking WebRTC role for long-press', e);
      }
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
          // setTimeout(() => timeline.redraw(), 0);
          timelineState.isEditingEpisode = false;
          
          // Synchronize via WebRTC if enabled (only for interviewer)
          if (window.webrtcSync && window.webrtcSync.isActive()) {
            const role = window.webrtcSync.getRole();
            if (role === "host") {
              try {
                window.webrtcSync.sendMessage({
                  type: "UPDATE_ITEMS",
                  items: [updatedItem]
                });
              } catch (e) {
                console.warn("Error during episode modification synchronization", e);
              }
            }
          }
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

  // Handle long press on group labels
  setupLongPressHandlers(timeline, groups, utils);

  // Handle clicks (time axis, group labels)
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

      // Summary and age are automatically updated via timechange event in verticalBar.js

      return;
    }

    if (properties.what === "group-label" && properties.group) {
      const clickedGroup = groups.get(properties.group);

      // Ignore click immediately following long-press on same group
      const last = window.__lastLongPress || { time: 0, groupId: null };
      const LONG_PRESS_CLICK_IGNORE_MS = 600;
      if (Date.now() - last.time < LONG_PRESS_CLICK_IGNORE_MS && last.groupId === properties.group) {
        try {
          window.__lastLongPress = null;
        } catch {}
        return; // consommer le click issu du mouseUp du long-press
      }

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
              // Closed group: retrieve items from landmark subgroup
              landmarkItems = items.get({
                filter: (item) => item.group === landmarkId,
              });
            } else {
              // Opened group: retrieve items moved to parent
              landmarkItems = items.get({
                filter: (item) =>
                  item.group === properties.group &&
                  item._originalGroup === landmarkId,
              });
            }

            landmarkItems.forEach((item) => {
              if (isClosed) {
                // Closing: move to parent group
                item._originalGroup = item.group;
                item.group = properties.group;
              } else if (item._originalGroup) {
                // Opening: restore original group
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

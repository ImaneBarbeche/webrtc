// timelineInteractions.js
import { items, groups } from "./timeline.js";
import { openEpisodeEditModal } from "../episodes/episodeEdit.js";
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
      // Empêcher l'édition par appui long si l'utilisateur n'est pas l'hôte WebRTC
      try {
        if (
          window.webrtcSync &&
          typeof window.webrtcSync.isActive === "function" &&
          window.webrtcSync.isActive() &&
          typeof window.webrtcSync.getRole === "function"
        ) {
          const role = window.webrtcSync.getRole();
          if (role !== "host") {
            // Invité / enqueté : ne pas activer le long-press pour ouvrir le modal
            return;
          }
        }
      } catch (e) {
        // En cas d'erreur, laisser le comportement par défaut (ne pas bloquer)
        console.warn('Erreur vérification rôle WebRTC pour long-press', e);
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
          setTimeout(() => timeline.redraw(), 0);
          timelineState.isEditingEpisode = false;
          
          // Synchroniser via WebRTC si activé (uniquement pour l'enquêteur)
          if (window.webrtcSync && window.webrtcSync.isActive()) {
            const role = window.webrtcSync.getRole();
            if (role === "host") {
              try {
                window.webrtcSync.sendMessage({
                  type: "UPDATE_ITEMS",
                  items: [updatedItem]
                });
              } catch (e) {
                console.warn("Erreur lors de la synchronisation de la modification d'épisode", e);
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

      // La synthèse et l'âge sont mis à jour automatiquement via l'événement timechange dans verticalBar.js

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
              // Groupe fermé : récupérer les items du sous-groupe landmark
              landmarkItems = items.get({
                filter: (item) => item.group === landmarkId,
              });
            } else {
              // Groupe ouvert : récupérer les items déplacés vers le parent
              landmarkItems = items.get({
                filter: (item) =>
                  item.group === properties.group &&
                  item._originalGroup === landmarkId,
              });
            }

            landmarkItems.forEach((item) => {
              if (isClosed) {
                // Fermeture : déplacer vers le groupe parent
                item._originalGroup = item.group;
                item.group = properties.group;
              } else if (item._originalGroup) {
                // Ouverture : restaurer le groupe d'origine
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

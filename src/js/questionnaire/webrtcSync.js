/**
 * WebRTC synchronization management for the questionnaire
 * Enables communication between two tablets (interviewer/interviewee)
 */

import { items } from "../timeline/timeline.js";
import { surveyService } from "../stateMachine/stateMachine.js";
import { setSyncConfig } from "./eventHandlers.js";
import { setBirthYear } from "../timeline/birthYear.js";
import { saveAnsweredQuestion } from "../stateMachine/persistence.js";

// Local variable to track if WebRTC is already activated
let webrtcActivated = false;

/**
 * Handle messages received from the other tablet
 * @param {object} message - The received message
 */
export function handleRemoteMessage(message) {
  if (message.type === "SURVEY_EVENT") {
    // Apply the received event to our state machine
    surveyService.send(message.event);
    // Save the modified answer
    if (message.event.type === "UPDATE_ANSWER" && message.event.key) {
      saveAnsweredQuestion(message.event.key, {
        key: message.event.key,
        value: message.event.value,
      });
    }

    // Special case: update of the birth date
    if (
      message.event.type === "UPDATE_ANSWER" &&
      (message.event.key === "birthdate" || message.event.key === "birthYear")
    ) {
      const birthYear = Number(message.event.value);
      if (!isNaN(birthYear) && window.timeline) {
        // Update the fixed display
        setBirthYear(birthYear);

        const birthDate = new Date(birthYear, 0, 1);
        const nowYear = new Date().getFullYear();

        // Update the timeline options
        window.timeline.setOptions({
          min: new Date(birthYear - 4, 0, 1),
          start: new Date(birthYear - 4, 0, 1),
          format: {
            minorLabels: function (date, scale, step) {
              if (scale === "year") {
                const currentYear = new Date(date).getFullYear();
                const age = currentYear - birthYear;
                let label = `<b>${currentYear}</b>`;
                if (currentYear >= birthYear && currentYear <= nowYear) {
                  label += `<br><span class="year-age">${age} ${
                    age > 1 ? "ans" : "an"
                  }</span>`;
                }
                return label;
              }
              // Map vis-timeline scale names to moment format tokens
              let fmt;
              switch (scale) {
                case "millisecond":
                  fmt = "SSS";
                  break;
                case "second":
                  fmt = "s";
                  break;
                case "minute":
                case "hour":
                  fmt = "HH:mm";
                  break;
                case "weekday":
                  fmt = "ddd D";
                  break;
                case "day":
                  fmt = "D";
                  break;
                case "week":
                  fmt = "w";
                  break;
                case "month":
                  fmt = "MMM";
                  break;
                case "year":
                  fmt = "YYYY";
                  break;
                default:
                  fmt = "D";
              }
              return vis.moment(date).format(fmt);
            },
          },
        });

        // Update the existing bar instead of recreating it
        window.timeline.setCustomTime(birthDate, "birth-year-bar");
        window.timeline.setCustomTimeTitle(birthYear, "birth-year-bar");

        window.timeline.setCustomTime(birthDate, "custom-bar");
        window.timeline.setCustomTimeTitle(birthYear, "custom-bar");

        window.timeline.redraw();
        window.timeline.fit();
      }
    }
  } else if (message.type === "LOAD_ITEMS") {
    handleLoadItems(message.items);
  } else if (message.type === "UPDATE_ITEMS") {
    handleUpdateItems(message.items);
  } else if (message.type === "ADD_ITEMS") {
    // Manual addition of episodes/events via the modal
    handleUpdateItems(message.items);
  } else if (message.type === "SURVEY_STATE") {
    // TODO: synchronize the full state if needed
  } else if (message.type === "RESET_ALL_DATA") {
    import("../stateMachine/stateMachine.js").then((module) => {
      module.resetAllData();
    });
  }
}

/**
 * Handles the update of modified items received via WebRTC
 * @param {Array} updatedItems - The items to update
 */
function handleUpdateItems(updatedItems) {
  try {
    if (!updatedItems || !Array.isArray(updatedItems)) {
      return;
    }

    // Convert ISO dates to Date objects if needed
    const parsed = updatedItems.map((i) => ({
      ...i,
      start: i.start ? new Date(i.start) : undefined,
      end: i.end ? new Date(i.end) : undefined,
    }));

    // Update existing items
    parsed.forEach((updatedItem) => {
      try {
        const existingItem = items.get(updatedItem.id);
        if (existingItem) {
          // The item exists, update it
          items.update(updatedItem);
        } else {
          // The item does not exist, add it
          items.add(updatedItem);
        }
      } catch (e) {
        console.warn("Erreur lors de la mise à jour d'un item", e, updatedItem);
      }
    });

    // Redraw the timeline if available
    if (window.timeline && typeof window.timeline.redraw === "function") {
      try {
        window.timeline.redraw();
      } catch (e) {
        console.warn("Erreur lors du redraw de la timeline", e);
      }
    }
  } catch (e) {
    console.error("Erreur lors de la mise à jour des items distants", e);
  }
}

/**
 * Handles the loading of items received via WebRTC
 * @param {Array} receivedItems - The items to load
 */
function handleLoadItems(receivedItems) {
  try {
    if (!receivedItems || !Array.isArray(receivedItems)) {
      return;
    }

    // Convert ISO dates to Date objects if needed
    const parsed = receivedItems.map((i) => ({
      ...i,
      start: i.start ? new Date(i.start) : undefined,
      end: i.end ? new Date(i.end) : undefined,
    }));

    // Add while avoiding duplicates
    const toAdd = [];
    parsed.forEach((i) => {
      try {
        if (items.get(i.id)) {
          // Generate a unique id if conflict
          const newId = `${i.id}_${Date.now()}`;
          toAdd.push(Object.assign({}, i, { id: newId }));
        } else {
          toAdd.push(i);
        }
      } catch (e) {
        console.warn("Erreur vérif item existant", e, i);
        toAdd.push(i);
      }
    });

    if (toAdd.length) {
      addItemsToTimeline(toAdd);
    }
  } catch (e) {
    console.error("Erreur lors du chargement des items distants", e);
  }
}

/**
 * Adds items to the timeline, handling the case where it is not yet ready
 * @param {Array} itemsToAdd - The items to add
 */
function addItemsToTimeline(itemsToAdd) {
  try {
    // If the timeline is already initialized, add and adjust the view
    if (window.timeline && typeof window.timeline.fit === "function") {
      items.add(itemsToAdd);
      try {
        window.timeline.redraw();
      } catch (e) {}
      try {
        window.timeline.fit();
      } catch (e) {}
    } else {
      // Temporarily persist for processing when the timeline is ready
      try {
        const existing = JSON.parse(
          localStorage.getItem("lifestories_pending_load_items") || "[]"
        );
        const merged = existing.concat(itemsToAdd);
        localStorage.setItem(
          "lifestories_pending_load_items",
          JSON.stringify(merged)
        );
      } catch (e) {
        // if localStorage unavailable, try to add directly
        try {
          items.add(itemsToAdd);
        } catch (err) {
          console.warn(
            "Impossible d'ajouter les items (timeline non prête)",
            err
          );
        }
      }
    }
  } catch (e) {
    console.error("Erreur lors de l'ajout des items distants", e);
  }
}

/**
 * Enables WebRTC synchronization
 * @returns {boolean} - true if successfully activated
 */
export function enableWebRTCSync() {
  if (window.webrtcSync && window.webrtcSync.isActive()) {
    // Only activate once
    if (webrtcActivated) {
      return true;
    }

    webrtcActivated = true;
    const isHost = window.webrtcSync.getRole() === "host";
    setSyncConfig(true, isHost);

    // Listen to events received from the other tablet (only once)
    if (!window.webrtcSyncListenerAdded) {
      window.webrtcSync.onMessage((message) => {
        handleRemoteMessage(message);
      });
      window.webrtcSyncListenerAdded = true;
    }

    return true;
  } else {
    return false;
  }
}


/**
 * Checks if WebRTC is activated
 * @returns {boolean}
 */
export function isWebRTCActivated() {
  return webrtcActivated;
}
/**
 * Processes pending items stored in localStorage
 * To be called once the timeline is ready
 */
export function processPendingItems() {
  try {
    const pendingRaw = localStorage.getItem("lifestories_pending_load_items");
    if (pendingRaw) {
      const pending = JSON.parse(pendingRaw);
      if (pending && pending.length) {
        try {
          items.add(pending);
        } catch (e) {
          console.warn("items.add pending failed", e);
        }
        try {
          window.timeline && window.timeline.redraw && window.timeline.redraw();
        } catch (e) {}
        try {
          window.timeline && window.timeline.fit && window.timeline.fit();
        } catch (e) {}
        localStorage.removeItem("lifestories_pending_load_items");
      }
    }
  } catch (e) {
    console.warn("Erreur en traitant les pending_load_items", e);
  }
}

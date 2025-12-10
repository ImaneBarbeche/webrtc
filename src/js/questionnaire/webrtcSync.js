/**
 * Gestion de la synchronisation WebRTC pour le questionnaire
 * Permet la communication entre deux tablettes (enquêteur/enquêté)
 */

import { items } from "../timeline/timeline.js";
import { surveyService } from "../stateMachine/stateMachine.js";
import { setSyncConfig } from "./eventHandlers.js";
import { setBirthYear } from "../timeline/birthYear.js";
import { saveAnsweredQuestion } from "../stateMachine/persistence.js";

// Variable locale pour tracker si WebRTC est déjà activé
let webrtcActivated = false;

/**
 * Gérer les messages reçus de l'autre tablette
 * @param {object} message - Le message reçu
 */
export function handleRemoteMessage(message) {
  if (message.type === "SURVEY_EVENT") {
    // Appliquer l'événement reçu à notre machine à états
    surveyService.send(message.event);
    // sauvegarder la réponse modifiée
    if (message.event.type === "UPDATE_ANSWER" && message.event.key) {
      saveAnsweredQuestion(message.event.key, {
        key: message.event.key,
        value: message.event.value,
      });
    }

    // Cas spécial : mise à jour de la date de naissance
    if (
      message.event.type === "UPDATE_ANSWER" &&
      (message.event.key === "birthdate" || message.event.key === "birthYear")
    ) {
      const birthYear = Number(message.event.value);
      if (!isNaN(birthYear) && window.timeline) {
        // Mettre à jour l'affichage fixe
        setBirthYear(birthYear);

        const birthDate = new Date(birthYear, 0, 1);
        const nowYear = new Date().getFullYear();

        // Mettre à jour les options de la timeline
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

        // Mettre à jour la barre existante au lieu de la recréer
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
  } else if (message.type === "SURVEY_STATE") {
    // TODO: synchroniser l'état complet si nécessaire
  } else if (message.type === "RESET_ALL_DATA") {
    import("../stateMachine/stateMachine.js").then((module) => {
      module.resetAllData();
    });
  }
}

/**
 * Gère la mise à jour des items modifiés reçus via WebRTC
 * @param {Array} updatedItems - Les items à mettre à jour
 */
function handleUpdateItems(updatedItems) {
  try {
    if (!updatedItems || !Array.isArray(updatedItems)) {
      return;
    }

    // Convertir les dates ISO en objets Date si nécessaire
    const parsed = updatedItems.map((i) => ({
      ...i,
      start: i.start ? new Date(i.start) : undefined,
      end: i.end ? new Date(i.end) : undefined,
    }));

    // Mettre à jour les items existants
    parsed.forEach((updatedItem) => {
      try {
        const existingItem = items.get(updatedItem.id);
        if (existingItem) {
          // L'item existe, le mettre à jour
          items.update(updatedItem);
        } else {
          // L'item n'existe pas, l'ajouter
          items.add(updatedItem);
        }
      } catch (e) {
        console.warn("Erreur lors de la mise à jour d'un item", e, updatedItem);
      }
    });

    // Redessiner la timeline si disponible
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
 * Gère le chargement des items reçus via WebRTC
 * @param {Array} receivedItems - Les items à charger
 */
function handleLoadItems(receivedItems) {
  try {
    if (!receivedItems || !Array.isArray(receivedItems)) {
      return;
    }

    // Convertir les dates ISO en objets Date si nécessaire
    const parsed = receivedItems.map((i) => ({
      ...i,
      start: i.start ? new Date(i.start) : undefined,
      end: i.end ? new Date(i.end) : undefined,
    }));

    // Ajouter en évitant les doublons
    const toAdd = [];
    parsed.forEach((i) => {
      try {
        if (items.get(i.id)) {
          // Générer un id unique si conflit
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
 * Ajoute des items à la timeline, avec gestion du cas où elle n'est pas encore prête
 * @param {Array} itemsToAdd - Les items à ajouter
 */
function addItemsToTimeline(itemsToAdd) {
  try {
    // Si la timeline est déjà initialisée, ajouter et ajuster la vue
    if (window.timeline && typeof window.timeline.fit === "function") {
      items.add(itemsToAdd);
      try {
        window.timeline.redraw();
      } catch (e) {}
      try {
        window.timeline.fit();
      } catch (e) {}
    } else {
      // Persister temporairement pour traitement lorsque la timeline sera prête
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
        // si localStorage indisponible, essayer d'ajouter directement
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
 * Active la synchronisation WebRTC
 * @returns {boolean} - true si activée avec succès
 */
export function enableWebRTCSync() {
  if (window.webrtcSync && window.webrtcSync.isActive()) {
    // N'activer qu'une seule fois
    if (webrtcActivated) {
      return true;
    }

    webrtcActivated = true;
    const isHost = window.webrtcSync.getRole() === "host";
    setSyncConfig(true, isHost);

    // Écouter les événements reçus de l'autre tablette (une seule fois)
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
 * Vérifie si WebRTC est activé
 * @returns {boolean}
 */
export function isWebRTCActivated() {
  return webrtcActivated;
}

/**
 * Traite les items en attente stockés dans localStorage
 * À appeler une fois que la timeline est prête
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

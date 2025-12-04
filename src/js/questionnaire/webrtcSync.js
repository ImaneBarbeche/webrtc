/**
 * Gestion de la synchronisation WebRTC pour le questionnaire
 * Permet la communication entre deux tablettes (enquêteur/enquêté)
 */

import { items } from "../timeline.js";
import { surveyService } from "../stateMachine.js";
import { setSyncConfig } from "./eventHandlers.js";

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
  } else if (message.type === "LOAD_ITEMS") {
    // L'enquêteur a envoyé un lot d'items à charger dans la timeline
    handleLoadItems(message.items);
  } else if (message.type === "SURVEY_STATE") {
    // Synchroniser l'état complet (utile pour rattrapage)
    // Note: XState v5 n'a pas de méthode simple pour forcer un état
    // On pourrait recréer le service ou envoyer des événements pour arriver au bon état
  } else if (message.type === "RESET_ALL_DATA") {
    // L'enquêteur a demandé une réinitialisation complète
    import("../stateMachine.js").then((module) => {
      module.resetAllData();
    });
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

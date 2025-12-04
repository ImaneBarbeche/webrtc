/**
 * Gestionnaires d'événements pour le questionnaire
 * Gère l'envoi des événements à la machine d'état et la synchronisation WebRTC
 */

import { surveyService, saveAnsweredQuestion } from "../stateMachine/stateMachine.js";

// Variables de synchronisation (seront initialisées depuis questionnaire.js)
let syncEnabled = false;
let isHost = true;

/**
 * Configure les variables de synchronisation
 * @param {boolean} sync - Si la synchronisation WebRTC est activée
 * @param {boolean} host - Si l'utilisateur est l'hôte
 */
export function setSyncConfig(sync, host) {
  syncEnabled = sync;
  isHost = host;
}

/**
 * Retourne si l'utilisateur est l'hôte
 */
export function getIsHost() {
  return isHost;
}

/**
 * Retourne si la synchronisation est activée
 */
export function getSyncEnabled() {
  return syncEnabled;
}

// Mapping des événements vers leurs états attendus
const eventToStateMap = {
  // Naissance
  ANSWER_BIRTH_YEAR: "askBirthYear",
  NEXT: null, // NEXT peut venir de plusieurs états
  ANSWER_CURRENT_COMMUNE: "askCurrentCommune",
  ANSWER_DEPARTEMENT: "askDepartementOrPays",

  // Commune
  YES: null, // YES/NO peuvent venir de plusieurs états
  NO: null,
  ANSWER_MULTIPLE_COMMUNES: "askMultipleCommunes",
  ANSWER_COMMUNE_ARRIVAL_YEAR: "askCommuneArrivalYear",
  ANSWER_COMMUNE_DEPARTURE_YEAR: "askCommuneDepartureYear",

  // Logement
  ANSWER_MULTIPLE_HOUSINGS: "askMultipleHousings",
  ANSWER_HOUSING_ARRIVAL: "askHousingArrivalAge",
  ANSWER_HOUSING_DEPARTURE: "askHousingDepartureAge",
  ANSWER_STATUS_ENTRY: "askHousingOccupationStatusEntry",
  ANSWER_STATUS_EXIT: "askHousingOccupationStatusExit",

  // Épisodes
  ADD_EPISODE: "recapEpisode",
  MODIFY_EPISODE: "recapEpisode",
  CREATE_NEW_EPISODE: "recapEpisode",
};

/**
 * Vérifie si on est sur la question actuelle (pas une modification d'historique)
 * @param {string} eventType - Le type d'événement
 * @returns {boolean}
 */
export function isCurrentQuestion(eventType) {
  const currentState = surveyService.getSnapshot();
  const currentValue = currentState.value;

  const expectedState = eventToStateMap[eventType];

  // Si l'événement n'a pas de mapping strict (NEXT, YES, NO), on considère que c'est OK
  if (expectedState === null || expectedState === undefined) {
    return true;
  }

  return expectedState === currentValue;
}

/**
 * Extrait la clé et la valeur d'un événement pour UPDATE_ANSWER
 * @param {object} eventData - Les données de l'événement
 * @returns {object} - { key, value, updateEpisode }
 */
function extractEventKeyValue(eventData) {
  let key = null;
  let value = null;
  let updateEpisode = false;

  if (eventData.statut_res !== undefined) {
    key = "statut_res";
    value = eventData.statut_res;
    updateEpisode = true;
  } else if (eventData.start !== undefined) {
    key = "start";
    value = eventData.start;
    updateEpisode = true;
  } else if (eventData.end !== undefined) {
    key = "end";
    value = eventData.end;
    updateEpisode = true;
  } else if (eventData.commune !== undefined) {
    key = "commune";
    value = eventData.commune;
  } else if (eventData.birthYear !== undefined) {
    key = "birthYear";
    value = eventData.birthYear;
  }

  return { key, value, updateEpisode };
}

/**
 * Envoyer un événement (local + remote si WebRTC activé)
 * Protection anti-double soumission : distingue modification vs nouvelle réponse
 * @param {object} eventData - Les données de l'événement
 * @param {boolean} allowAdvance - Si true, permet de passer à la question suivante
 */
export function sendEvent(eventData, allowAdvance = true) {
  // Vérifier si on est hôte
  if (!isHost) {
    console.warn("VIEWER ne peut pas envoyer d'événements");
    return;
  }

  // Protection : si c'est une modification d'historique, envoyer UPDATE_ANSWER
  if (!allowAdvance || !isCurrentQuestion(eventData.type)) {
    const { key, value, updateEpisode } = extractEventKeyValue(eventData);

    const updateEvent = {
      type: "UPDATE_ANSWER",
      key: key,
      value: value,
      updateEpisode: updateEpisode,
    };

    surveyService.send(updateEvent);

    if (syncEnabled && window.webrtcSync) {
      window.webrtcSync.sendEvent(updateEvent);
    }

    return;
  }

  // Envoyer localement
  // IMPORTANT: capturer l'état courant AVANT d'envoyer l'événement
  // car l'envoi provoque une transition et la snapshot après envoi
  // correspondra à l'état suivant
  const currentStateBefore = surveyService.getSnapshot().value;
  surveyService.send(eventData);

  // Sauvegarder la réponse dans l'historique
  saveAnsweredQuestion(currentStateBefore, eventData);
  
  if (syncEnabled && window.webrtcSync) {
    window.webrtcSync.sendEvent(eventData);
  } else {
    console.warn("WebRTC non disponible pour envoi");
  }
}

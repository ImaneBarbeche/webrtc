/**
 * Event handlers for the questionnaire.
 * Responsible for sending events to the state machine and synchronizing them through WebRTC.
 */

import { surveyService, saveAnsweredQuestion } from "../stateMachine/stateMachine.js";

// Synchronization flags (initialized externally from questionnaire.js)
let syncEnabled = false;
let isHost = true;

/**
 * Configure synchronization settings.
 * @param {boolean} sync - Whether WebRTC synchronization is enabled.
 * @param {boolean} host - Whether the current user is the host (allowed to send events).
 */
export function setSyncConfig(sync, host) {
  syncEnabled = sync;
  isHost = host;
}

/**
 * Returns whether the user is the host.
 */
export function getIsHost() {
  return isHost;
}

/**
 * Returns whether synchronization is enabled.
 */
export function getSyncEnabled() {
  return syncEnabled;
}

// Mapping between event types and the state in which they are expected.
// Used to detect whether an event is modifying history or answering the current question.
const eventToStateMap = {
  // Birth
  ANSWER_BIRTH_YEAR: "askBirthYear",
  NEXT: null, // NEXT can occur in multiple states
  ANSWER_CURRENT_COMMUNE: "askCurrentCommune",
  ANSWER_DEPARTEMENT: "askDepartementOrPays",

  // Commune
  YES: null, // YES/NO can occur in multiple states
  NO: null,
  ANSWER_MULTIPLE_COMMUNES: "askMultipleCommunes",
  ANSWER_COMMUNE_ARRIVAL_YEAR: "askCommuneArrivalYear",
  ANSWER_COMMUNE_DEPARTURE_YEAR: "askCommuneDepartureYear",

  // Housing
  ANSWER_MULTIPLE_HOUSINGS: "askMultipleHousings",
  ANSWER_HOUSING_ARRIVAL: "askHousingArrivalAge",
  ANSWER_HOUSING_DEPARTURE: "askHousingDepartureAge",
  ANSWER_STATUS_ENTRY: "askHousingOccupationStatusEntry",
  ANSWER_STATUS_EXIT: "askHousingOccupationStatusExit",

  // Episodes
  ADD_EPISODE: "recapEpisode",
  MODIFY_EPISODE: "recapEpisode",
  CREATE_NEW_EPISODE: "recapEpisode",
};

/**
 * Determines whether the event corresponds to the current question
 * (as opposed to modifying a past answer).
 *
 * @param {string} eventType - The type of event being sent.
 * @returns {boolean} - True if the event is valid for the current question.
 */
export function isCurrentQuestion(eventType) {
  const currentState = surveyService.getSnapshot();
  const currentValue = currentState.value;

  const expectedState = eventToStateMap[eventType];

  // If the event has no strict mapping (e.g., NEXT, YES, NO),
  // it is considered valid for any state.
  if (expectedState === null || expectedState === undefined) {
    return true;
  }

  return expectedState === currentValue;
}

/**
 * Extracts the key/value pair from an event for UPDATE_ANSWER.
 * This is used when modifying a past answer rather than progressing forward.
 *
 * @param {object} eventData - The event payload.
 * @returns {object} - { key, value, updateEpisode }
 */
function extractEventKeyValue(eventData) {
  let key = null;
  let value = null;
  let updateEpisode = false;

  // Episode-related updates
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

  // Standard questionnaire fields
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
 * Sends an event to the state machine (and optionally through WebRTC).
 * Includes protection against double submissions and distinguishes between:
 *  - answering the current question
 *  - modifying a past answer (UPDATE_ANSWER)
 *
 * @param {object} eventData - The event payload.
 * @param {boolean} allowAdvance - Whether this event is allowed to advance the questionnaire.
 */
export function sendEvent(eventData, allowAdvance = true) {
  // Only the host is allowed to send events.
  if (!isHost) {
    console.warn("VIEWER cannot send events");
    return;
  }

  // If modifying history or advancing is not allowed,
  // convert the event into an UPDATE_ANSWER event.
  if (!allowAdvance || !isCurrentQuestion(eventData.type)) {
    const { key, value, updateEpisode } = extractEventKeyValue(eventData);

    const updateEvent = {
      type: "UPDATE_ANSWER",
      key: key,
      value: value,
      updateEpisode: updateEpisode,
    };

    // Send locally
    surveyService.send(updateEvent);

    // Send remotely if synchronization is enabled
    if (syncEnabled && window.webrtcSync) {
      window.webrtcSync.sendEvent(updateEvent);
    }

    return;
  }

  // --- Normal forward progression ---

  // Capture the current state BEFORE sending the event.
  // After sending, the state machine transitions to the next state,
  // so we need the previous state to store the answer history correctly.
  const currentStateBefore = surveyService.getSnapshot().value;

  // Send the event to the state machine
  surveyService.send(eventData);

  // Save the answer in the history log
  saveAnsweredQuestion(currentStateBefore, eventData);

  // Send through WebRTC if enabled
  if (syncEnabled && window.webrtcSync) {
    window.webrtcSync.sendEvent(eventData);
  } else {
    console.warn("WebRTC not available for sending");
  }
}

/*
********************************************************************************
* context.js - Default context and initialization                              *
* Defines the structure of the survey data and how it is initialized           *
********************************************************************************
*/

import { items } from "../timeline/timeline.js";
import { loadSavedContext } from "./persistence.js";

/**
 * Default context for the state machine.
 * This object contains all data collected throughout the survey.
 * It is used as the base context when no saved session is available.
 */
export const defaultContext = {
  birthYear: 0,
  birthPlace: '',           // Birthplace of the respondent (or parents)
  communes: [],             // List of communes visited/declared
  departements: [],         // List of associated departments/countries
  currentCommuneIndex: 0,   // Index of the commune currently being processed
  logements: [],            // List of housings for each commune
  currentLogementIndex: 0,  // Index of the housing currently being processed
  group: 13,                // Starting group (communes workflow)
  lastEpisode: null,        // Last episode added to the timeline
};

/**
 * Retrieves the most recently added episode from the timeline.
 * This is useful when restoring a saved session and wanting to reconnect
 * the state machine with the timeline state.
 *
 * @returns {object|null} The last episode object, or null if none exists.
 */
export function getLastEpisodeFromTimeline() {
  try {
    const allItems = items.get();
    if (allItems && allItems.length > 0) {
      // Return the last item in the timeline array
      const lastItem = allItems[allItems.length - 1];
      return lastItem;
    }
  } catch (e) {
    console.warn('Unable to retrieve last episode:', e);
  }
  return null;
}

/**
 * Initializes the context by loading any previously saved data.
 * If saved data exists, it is merged with the timeline state to restore
 * the last known episode. Otherwise, the default context is used.
 *
 * @returns {{
 *   initialContext: object,
 *   initialState: string,
 *   savedContext: object|null,
 *   savedState: string|null
 * }}
 */
export function initializeContext() {
  // Load saved context and state from persistence layer
  const { context: savedContext, savedState } = loadSavedContext();
  
  // Use saved context if available, otherwise fall back to default
  let initialContext = savedContext || defaultContext;
  
  // If restoring a session, also restore the last episode from the timeline
  if (savedContext) {
    initialContext = {
      ...initialContext,
      lastEpisode: getLastEpisodeFromTimeline()
    };
  }
  
  // Use saved state if available, otherwise start at the beginning
  const initialState = savedState || 'askBirthYear';
  
  return {
    initialContext,
    initialState,
    savedContext,
    savedState
  };
}

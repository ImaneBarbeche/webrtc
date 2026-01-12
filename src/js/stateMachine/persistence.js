/*
********************************************************************************
* persistence.js - localStorage persistence utilities                          *
* Handles saving and loading of the survey context and answered questions      *
********************************************************************************
*/

const STORAGE_KEYS = {
  CONTEXT: 'lifestories_context',
  CURRENT_STATE: 'lifestories_current_state',
  ANSWERED_QUESTIONS: 'lifestories_answered_questions',
  ITEMS: 'lifestories_items',
  GROUPS: 'lifestories_groups',
  OPTIONS: 'lifestories_options'
};

/**
 * Loads the saved context from localStorage.
 * This includes:
 *  - the serialized XState context
 *  - the last known state of the state machine
 *
 * @returns {{ context: object|null, savedState: string|null }}
 *          context:     the restored context object or null if none exists
 *          savedState:  the restored state name or null if none exists
 */
export function loadSavedContext() {
  try {
    const savedContextStr = localStorage.getItem(STORAGE_KEYS.CONTEXT);
    const savedStateStr = localStorage.getItem(STORAGE_KEYS.CURRENT_STATE);
    
    if (savedContextStr) {
      const context = JSON.parse(savedContextStr);
      const state = savedStateStr ? JSON.parse(savedStateStr) : null;
      return { context, savedState: state };
    }
  } catch (e) {
    console.error('❌ Error while loading context:', e);
  }

  // No saved data found or an error occurred
  return { context: null, savedState: null };
}

/**
 * Saves the current context and state into localStorage.
 *
 * Important:
 *  - lastEpisode is intentionally excluded because it contains circular
 *    references (timeline items referencing groups, etc.), which cannot be
 *    serialized with JSON.stringify.
 *
 * @param {object} context - The current XState context
 * @param {string} state - The current state of the state machine
 */
export function saveContext(context, state) {
  try {
    // Create a serializable copy of the context without lastEpisode
    const contextToSave = {
      birthYear: context.birthYear,
      birthPlace: context.birthPlace,
      communes: context.communes,
      departements: context.departements,
      currentCommuneIndex: context.currentCommuneIndex,
      logements: context.logements,
      currentLogementIndex: context.currentLogementIndex,
      group: context.group,
    };
        
    localStorage.setItem(STORAGE_KEYS.CONTEXT, JSON.stringify(contextToSave));
    localStorage.setItem(STORAGE_KEYS.CURRENT_STATE, JSON.stringify(state));
  } catch (e) {
    console.error('❌ Error while saving context:', e);
  }
}

/**
 * Saves a single answered question into the history.
 * Each entry contains:
 *  - the state in which the question was asked
 *  - the event data (the answer)
 *  - a timestamp
 *
 * If a question with the same state already exists, it is replaced.
 * This ensures that the history always reflects the latest answer.
 *
 * @param {string} state - The state associated with the question
 * @param {object} eventData - The event payload representing the answer
 */
export function saveAnsweredQuestion(state, eventData) {
  try {
    const answeredQuestions = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ANSWERED_QUESTIONS) || '[]'
    );

    const newEntry = {
      state,
      answer: eventData,
      timestamp: new Date().toISOString()
    };

    // Check if an answer already exists for this state
    const existingIndex = answeredQuestions.findIndex(
      q => q.state === state
    );

    if (existingIndex >= 0) {
      // Replace the previous answer
      answeredQuestions[existingIndex] = newEntry;
    } else {
      // Add a new entry
      answeredQuestions.push(newEntry);
    }

    localStorage.setItem(
      STORAGE_KEYS.ANSWERED_QUESTIONS,
      JSON.stringify(answeredQuestions)
    );
  } catch (e) {
    console.error('❌ Error while saving answer:', e);
  }
}

/**
 * Loads the full history of answered questions from localStorage.
 *
 * @returns {Array} An array of saved answer entries (or an empty array)
 */
export function loadAnsweredQuestions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ANSWERED_QUESTIONS);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('❌ Error while loading answer history:', e);
    return [];
  }
}

/**
 * Completely resets all application data.
 * Removes every key used by the app from localStorage,
 * then reloads the page to restart with a clean state.
 */
export function resetAllData() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  window.location.reload();
}

// Export storage keys for external use if needed
export { STORAGE_KEYS };

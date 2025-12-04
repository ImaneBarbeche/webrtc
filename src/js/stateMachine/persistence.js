/*
********************************************************************************
* persistence.js - Fonctions de persistance localStorage                       *
* Gère la sauvegarde et le chargement du contexte et des réponses             *
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
 * Charge le contexte sauvegardé depuis localStorage
 * @returns {{ context: object|null, savedState: string|null }}
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
    console.error('❌ Erreur lors du chargement du contexte:', e);
  }
  return { context: null, savedState: null };
}

/**
 * Sauvegarde le contexte dans localStorage
 * Note: lastEpisode est exclu car il contient des références circulaires
 * @param {object} context - Le contexte à sauvegarder
 * @param {string} state - L'état actuel
 */
export function saveContext(context, state) {
  try {
    // Créer une copie du contexte sans lastEpisode (car il contient des références circulaires)
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
    console.error('❌ Erreur lors de la sauvegarde du contexte:', e);
  }
}

/**
 * Sauvegarde une question répondue dans l'historique
 * @param {string} state - L'état de la question
 * @param {object} eventData - Les données de l'événement/réponse
 */
export function saveAnsweredQuestion(state, eventData) {
  try {
    const answeredQuestions = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ANSWERED_QUESTIONS) || '[]'
    );
    
    // Ajouter la nouvelle réponse
    answeredQuestions.push({
      state: state,
      answer: eventData,
      timestamp: new Date().toISOString()
    });
    
    // Sauvegarder
    localStorage.setItem(
      STORAGE_KEYS.ANSWERED_QUESTIONS,
      JSON.stringify(answeredQuestions)
    );
  } catch (e) {
    console.error('❌ Erreur lors de la sauvegarde de la réponse:', e);
  }
}

/**
 * Charge l'historique des réponses depuis localStorage
 * @returns {Array} Tableau des questions répondues
 */
export function loadAnsweredQuestions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ANSWERED_QUESTIONS);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('❌ Erreur lors du chargement de l\'historique:', e);
    return [];
  }
}

/**
 * Réinitialise toutes les données de l'application
 * Supprime toutes les clés localStorage et recharge la page
 */
export function resetAllData() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  window.location.reload();
}

// Export des clés pour usage externe si nécessaire
export { STORAGE_KEYS };

// XState est chargé via UMD en tant que variable globale window.XState
const { createMachine, interpret, assign } = window.XState;
import { modifierEpisode } from "../episodes.js";
import { timeline, items } from "../timeline.js";
import { 
  loadSavedContext, 
  saveContext, 
  saveAnsweredQuestion, 
  loadAnsweredQuestions, 
  resetAllData 
} from "./persistence.js";
import { 
  stateToQuestionMap, 
  getQuestionFromState 
} from "./stateToQuestionMap.js";
import {
  defaultContext,
  getLastEpisodeFromTimeline,
  initializeContext
} from "./context.js";
import { guards } from "./guards.js";
import { actions } from "./actions.js";
/*
********************************************************************************
* stateMachine.js décrit la machine à état                                     *
* (ensemble d'états et de transitions qui décrit le comportement d'un systeme) *
********************************************************************************
*/
// Initialiser le contexte (charge depuis localStorage si disponible)
const { initialContext, initialState, savedContext, savedState } = initializeContext();

export const surveyMachine = createMachine({
  id: 'survey',
  initial: initialState, // Utiliser l'état sauvegardé 
  context: initialContext, // Utiliser le contexte sauvegardé 
  on: {
    // Événement global pour restaurer lastEpisode après chargement
    RESTORE_LAST_EPISODE: {
      actions: assign({
        lastEpisode: ({ event }) => event.lastEpisode
      })
    },
    // Événement global pour mettre à jour une réponse sans changer d'état
    UPDATE_ANSWER: {
      actions: assign(({ context, event }) => {
        // Mettre à jour le contexte selon le type de réponse
        const updates = {};
        
        if (event.key) {
          updates[event.key] = event.value;
        }
        
        // Si on modifie un épisode, le mettre à jour dans la timeline
        if (event.updateEpisode) {
          // Trouver l'épisode à modifier selon la clé
          let episodeToUpdate = null;
          
          if (event.key === 'statut_res') {
            // Chercher l'épisode de statut (groupe 11)
            const allItems = items.get();
            const statusEpisodes = allItems.filter(item => item.group === 11);
            if (statusEpisodes.length > 0) {
              episodeToUpdate = statusEpisodes[statusEpisodes.length - 1]; // Prendre le dernier
            }
          } else {
            // Pour les autres, utiliser lastEpisode
            episodeToUpdate = context.lastEpisode;
          }
          
          if (episodeToUpdate) {
            const modifs = {};
            modifs[event.key] = event.value;
            modifierEpisode(episodeToUpdate.id, modifs);
          } else {
            console.warn('Aucun épisode trouvé pour la modification');
          }
        } else if (event.key === 'commune') {
          // Pour les communes, modifier l'épisode même si updateEpisode est false
          // IMPORTANT: Ne pas modifier si la valeur est Yes/No (ce n'est pas un nom de commune)
          if (event.value && event.value !== 'Yes' && event.value !== 'No') {
            const allItems = items.get();
            const communeEpisodes = allItems.filter(item => item.group === 13);
            if (communeEpisodes.length > 0) {
              const lastCommuneEpisode = communeEpisodes[communeEpisodes.length - 1];
              modifierEpisode(lastCommuneEpisode.id, {content: event.value});
            }
          }
          
          // IMPORTANT: Mettre aussi à jour le tableau communes[] pour que les questions suivantes utilisent la nouvelle valeur
          if (context.communes && context.communes.length > 0) {
            // Mettre à jour la commune à l'index courant (ou la première si index = 0)
            const indexToUpdate = context.currentCommuneIndex || 0;
            const newCommunes = [...context.communes];
            newCommunes[indexToUpdate] = event.value;
            updates.communes = newCommunes;
          }
        } else if (event.key === 'communes') {
          // Modification de la liste complète des communes
          // Nettoyer les épisodes orphelins sur la timeline (groupe 13)
          const allItems = items.get();
          const communeEpisodes = allItems.filter(item => item.group === 13);
          const newCommunes = event.value || [];
          
          // Supprimer les épisodes qui ne correspondent plus à aucune commune
          // On garde le premier épisode (commune de naissance) et on nettoie les autres
          if (communeEpisodes.length > 1) {
            // Garder seulement les épisodes dont le contenu est dans la nouvelle liste
            // ou le premier épisode (commune de naissance)
            const episodesToRemove = communeEpisodes.slice(1).filter(ep => {
              return !newCommunes.includes(ep.content);
            });
            
            episodesToRemove.forEach(ep => {
              items.remove(ep.id);
            });
            
            // Supprimer aussi les épisodes enfants (logements groupe 12, statuts groupe 11)
            const childEpisodes = allItems.filter(item => item.group === 12 || item.group === 11);
            childEpisodes.forEach(ep => {
              items.remove(ep.id);
            });
          }
          
          // Réinitialiser l'index des communes pour recommencer
          updates.currentCommuneIndex = 0;
          updates.logements = [];
          updates.currentLogementIndex = 0;
        }
        
        return updates;
      })
    }
  },
  states: {
    askBirthYear: {
      on: {
        ANSWER_BIRTH_YEAR: {
          actions: ['saveBirthYear', 'setupCalendar'],
          target: 'birthPlaceIntro'
        }
      }
    },
    
    birthPlaceIntro: {
      on: {
        NEXT: {
          target: 'askCurrentCommune'
        }
      }
    },

    askCurrentCommune: {
      on: {
        ANSWER_CURRENT_COMMUNE: {
          actions: ['addCommune'],
          target: 'askDepartementOrPays'
        }
      }
    },

    askDepartementOrPays: {
      on: {
        ANSWER_DEPARTEMENT: {
          actions: [
            'addDepartement',
            {
              type: 'addCalendarEpisode', params: {start: "timeline_init"}
            }
          ],
          target: 'askAlwaysLivedInCommune'
        }
      }
    },

    askAlwaysLivedInCommune: {
      on: {
        YES: {
          actions: [
            {
              type: 'modifyCalendarEpisode', params: {end: 'timeline_end'}
            },
            'nextGroup',  // Passer de groupe 13 (commune) à groupe 12 (type logement)
          ],
          target: 'askSameHousingInCommune'
        },
        NO: 'askMultipleCommunes'
      }
    },

    askMultipleCommunes: {
      on: {
        ANSWER_MULTIPLE_COMMUNES: {
          actions: [
            'addMultipleCommunes'
          ],
          target: 'placeNextCommuneOnTimeline'
        }
      }
    },

    placeNextCommuneOnTimeline: {
      always: [
        {
          guard: 'hasMoreCommunesToPlace',
          target: 'askCommuneArrivalYear'
        },
        {
          actions: [
            'nextGroup',  // Passer de groupe 13 (commune) à groupe 12 (logement)
            'resetCommune'  // Réinitialiser l'index pour recommencer à la première commune
          ],
          target: 'askSameHousingInCommune'
        }
      ]
    },

    askCommuneArrivalYear: {
      on: {
        ANSWER_COMMUNE_ARRIVAL: {
          actions: ['closePreviousCommuneEpisode', 'addCalendarEpisode'],
          target: 'askCommuneDepartureYear'
        }
      }
    },

    askCommuneDepartureYear: {
      on: {
        ANSWER_COMMUNE_DEPARTURE: {
          actions: ['modifyCalendarEpisode', 'nextCommune'],
          target: 'placeNextCommuneOnTimeline'
        }
      }
    },

    askSameHousingInCommune: {
      entry: [
      ],
      on: {
        YES: {
          actions: [
            assign({
              logements: ({context}) => {
                return ['Logement unique'];
              },
              currentLogementIndex: 0
            }),
            'addCalendarEpisode',     // Créer épisode dans groupe 12 (logement)
          ],
          target: 'askHousingOccupationStatusEntry'
        },
        NO: 'askMultipleHousings'
      }
    },

    askMultipleHousings: {
      on: {
        ANSWER_MULTIPLE_HOUSINGS: {
          actions: [
            'addMultipleHousings',
            'resetLogement'
          ],
          target: 'askHousingArrivalAge'
        }
      }
    },

    askHousingArrivalAge: {
      on: {
        ANSWER_HOUSING_ARRIVAL: {
          actions: ['addCalendarEpisode'],
          target: 'askHousingDepartureAge'
        }
      }
    },

    askHousingDepartureAge: {
      on: {
        ANSWER_HOUSING_DEPARTURE: {
          actions: ['modifyCalendarEpisode'],
          target: 'askHousingOccupationStatusEntry'
        }
      }
    },

    askHousingOccupationStatusEntry: {
      entry: [
        'nextGroup',
      ],
      on: {
        ANSWER_STATUS_ENTRY: {
          actions: ['addCalendarEpisode'],  // Créer épisode dans groupe 11 (statut)
          target: 'askHousingOccupationStatusExit'
        }
      }
    },

    askHousingOccupationStatusExit: {
      on: {
        ANSWER_STATUS_EXIT: {
          actions: ['modifyCalendarEpisode'],
          target: 'checkMoreHousings'
        }
      }
    },

    checkMoreHousings: {
      entry: [
      ],
      always: [
        {
          guard: 'moreLogementsToProcess',
          actions: [
            'nextLogement',
            'previousGroup',  // Remonter de groupe 11 (statut) à groupe 12 (logement)
          ],
          target: 'askHousingArrivalAge'
        },
        {
          guard: 'moreCommunesToProcess',
          actions: [
            'nextCommune',  // Passer à la commune suivante
            'resetLogement',  // Réinitialiser l'index des logements pour la prochaine commune
            'previousGroup',  // 11 → 12
          ],
          target: 'askSameHousingInCommune'
        },
        {
          actions: [
          ],
          target: 'surveyComplete'
        }
      ]
    },
    surveyComplete: {
      type: 'final'
    }
  }
}, {
  actions,
  guards
});

// Créer le service et le configurer avec les données sauvegardées
// Utiliser let pour pouvoir réassigner lors de la navigation
export let surveyService = interpret(surveyMachine);

// Callback pour re-rendre les questions après navigation
let renderCallback = null;

// Fonction pour définir le callback de rendu (appelée depuis questionnaire.js)
export function setRenderCallback(callback) {
  renderCallback = callback;
}

// Fonction pour initialiser le service avec l'état sauvegardé
export function initializeSurveyService() {
  // Démarrer le service (l'état initial est déjà configuré dans la machine)
  surveyService.start();
  
  // IMPORTANT : Restaurer lastEpisode APRÈS le démarrage
  if (savedContext && savedState) {
    const lastEpisode = getLastEpisodeFromTimeline();
    if (lastEpisode) {
      // Mettre à jour le contexte du service
      surveyService.send({
        type: 'RESTORE_LAST_EPISODE',
        lastEpisode: lastEpisode
      });
    }
  }
  
  
  
  // Si on a un contexte sauvegardé, restaurer les options de la timeline
  if (initialContext && initialContext.birthYear && initialContext.birthYear > 0) {
    // Vérifier que timeline existe avant de l'utiliser
    if (timeline && typeof timeline.setOptions === 'function') {
      timeline.setOptions({
        min: new Date(`${initialContext.birthYear}-01-01`), 
        start: new Date(`${initialContext.birthYear}-01-01`)
      });
      
      // Restaurer aussi le format de l'âge
      timeline.setOptions({
        format: {
          minorLabels: function(date, scale, step) {
            switch (scale) {
              case 'year':
                const age = new Date(date).getFullYear() - initialContext.birthYear;
                return '<b>' + new Date(date).getFullYear() + '</b></br><b>' + age + `</b> ${age != 0 && age != 1 ? 'ans' : 'an'}`;
              default:
                return vis.moment(date).format(scale === 'month' ? 'MMM' : 'D');
            }
          }
        }
      });
    } else {
      console.warn('⚠️ Timeline pas encore initialisée ou setOptions non disponible');
    }
  }  // Sauvegarder le contexte après chaque transition
  surveyService.subscribe((state) => {
    saveContext(state.context, state.value);
  });
}

/**
 * Restaurer l'état depuis un état distant (WebRTC)
 * IMPORTANT : Utilisé UNIQUEMENT pour la synchronisation en temps réel
 * PAS pour la persistance après fermeture (localStorage fait ça)
 */
export function restoreFromRemoteState(remoteState) {
  try {
    // Sauvegarder dans localStorage (pour persistance)
    saveContext(remoteState.context, remoteState.value);
    
    // Arrêter le service actuel
    surveyService.stop();
    
    // Redémarrer avec le nouvel état
    surveyService.start({
      value: remoteState.value,
      context: remoteState.context
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation distante:', error);
  }
}

/**
 * Naviguer vers un état spécifique en recréant la machine
 * @param {string} targetState - L'état cible
 * @param {object} contextUpdates - Mises à jour du contexte
 * @param {function} clearQuestionsCallback - Callback pour vider les questions du DOM
 */
export function navigateToState(targetState, contextUpdates = {}, clearQuestionsCallback = null) {
  try {
    // Récupérer le contexte actuel
    const currentSnapshot = surveyService.getSnapshot();
    const currentContext = currentSnapshot.context;
    
    // Fusionner les mises à jour avec le contexte actuel
    const newContext = {
      ...currentContext,
      ...contextUpdates,
      lastEpisode: getLastEpisodeFromTimeline()
    };
    
    // Sauvegarder dans localStorage
    saveContext(newContext, targetState);
    
    // Arrêter l'ancien service
    surveyService.stop();
    
    // Créer une nouvelle machine avec le nouvel état initial
    const newMachine = createMachine({
      ...surveyMachine.config,
      initial: targetState,
      context: newContext
    }, surveyMachine.implementations);
    
    // Créer un nouveau service
    surveyService = interpret(newMachine);
    
    // Réabonner pour sauvegarder après chaque transition
    surveyService.subscribe((state) => {
      saveContext(state.context, state.value);
      // Appeler le callback de rendu si défini
      if (renderCallback) {
        renderCallback(state);
      }
    });
    
    // Vider les questions du DOM si callback fourni
    if (clearQuestionsCallback) {
      clearQuestionsCallback();
    }
    
    // Démarrer le nouveau service
    surveyService.start();
    
    // Rendre la question initiale
    if (renderCallback) {
      const newState = surveyService.getSnapshot();
      renderCallback(newState);
    }
        
  } catch (error) {
    console.error('❌ Erreur lors de la navigation:', error);
  }
}

// Exporter pour que questionnaire.js puisse l'utiliser
export { savedContext, savedState };

// Réexporter les fonctions pour les autres modules
export { saveAnsweredQuestion, loadAnsweredQuestions, resetAllData, stateToQuestionMap, getQuestionFromState };
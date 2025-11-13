// XState est chargé via UMD en tant que variable globale window.XState
const { createMachine, interpret, assign } = window.XState;

import { ajouterEpisode, modifierEpisode } from "./episodes.js"
import { timeline, groups, items } from "./timeline.js";
/*
********************************************************************************
* stateMachine.js décrit la machine à état                                     *
* (ensemble d'états et de transitions qui décrit le comportement d'un systeme) *
********************************************************************************
*/

// Fonction pour charger le contexte sauvegardé
function loadSavedContext() {
  try {
    const savedContextStr = localStorage.getItem('lifestories_context');
    const savedStateStr = localStorage.getItem('lifestories_current_state');
    
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

// Fonction pour sauvegarder le contexte
function saveContext(context, state) {
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
        
    localStorage.setItem('lifestories_context', JSON.stringify(contextToSave));
    localStorage.setItem('lifestories_current_state', JSON.stringify(state));
  } catch (e) {
    console.error('❌ Erreur lors de la sauvegarde du contexte:', e);
  }
}

// Fonction pour réinitialiser toutes les données
export function resetAllData() {
  localStorage.removeItem('lifestories_context');
  localStorage.removeItem('lifestories_current_state');
  localStorage.removeItem('lifestories_items');
  localStorage.removeItem('lifestories_groups');
  localStorage.removeItem('lifestories_options');
  window.location.reload();
}

// Charger le contexte initial ou utiliser les valeurs par défaut
const { context: savedContext, savedState } = loadSavedContext();

const defaultContext = {
  birthYear: 0,
  birthPlace: '',           // Lieu de naissance des parents
  communes: [],             // Liste des communes
  departements: [],         // Liste des départements/pays associés
  currentCommuneIndex: 0,
  logements: [],            // Liste des logements par commune
  currentLogementIndex: 0,
  group: 13,
  lastEpisode: null,
};

// Fonction pour récupérer le dernier épisode depuis la timeline
function getLastEpisodeFromTimeline() {
  try {
    const allItems = items.get();
    if (allItems && allItems.length > 0) {
      // Retourner le dernier item ajouté
      const lastItem = allItems[allItems.length - 1];
      return lastItem;
    }
  } catch (e) {
    console.warn('⚠️ Impossible de récupérer le dernier épisode:', e);
  }
  return null;
}

// Utiliser le contexte sauvegardé si disponible
let initialContext = savedContext || defaultContext;

// Si on restaure un état, récupérer aussi le lastEpisode depuis la timeline
if (savedContext) {
  initialContext = {
    ...initialContext,
    lastEpisode: getLastEpisodeFromTimeline()
  };
}

// Utiliser l'état sauvegardé si disponible, sinon démarrer au début
const initialState = savedState || 'askBirthYear';

export const surveyMachine = createMachine({
  id: 'survey',
  initial: initialState, // ✅ Utiliser l'état sauvegardé !
  context: initialContext, // ✅ Utiliser le contexte sauvegardé !
  on: {
    // Événement global pour restaurer lastEpisode après chargement
    RESTORE_LAST_EPISODE: {
      actions: assign({
        lastEpisode: ({ event }) => event.lastEpisode
      })
    },
    // 🆕 Événement global pour mettre à jour une réponse sans changer d'état
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
            console.warn('⚠️ Aucun épisode trouvé pour la modification');
          }
        } else if (event.key === 'commune') {
          // Pour les communes, modifier l'épisode même si updateEpisode est false
          const allItems = items.get();
          const communeEpisodes = allItems.filter(item => item.group === 13);
          if (communeEpisodes.length > 0) {
            const lastCommuneEpisode = communeEpisodes[communeEpisodes.length - 1];
            modifierEpisode(lastCommuneEpisode.id, {content: event.value});
          }
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
              type: 'modifyCalendarEpisode', params: {end: timeline.options.end}
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
              logements: ({context}) => ['Logement unique'],
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
  actions: {
    saveBirthYear: assign({
      birthYear: ({context, event}) => parseInt(event.birthdate)
    }),

    saveBirthPlace: assign({
      birthPlace: ({context, event}) => event.birthPlace
    }),

    addCommune: assign({
      communes: ({context, event}) => {
        return [...context.communes, event.commune];
      }
    }),

    addDepartement: assign({
      departements: ({context, event}) => {
        return [...context.departements, event.departement];
      }
    }),

    addMultipleCommunes: assign({
      communes: ({context, event}) => {
        return [...context.communes, ...event.communes];
      },
      currentCommuneIndex: ({context}) => {
        // Positionner l'index sur la première nouvelle commune ajoutée
        return context.communes.length;
      }
    }),

    addMultipleHousings: assign({
      logements: ({context, event}) => {
        // Pour la commune courante, stocker la liste des logements
        return event.logements || [];
      }
    }),

    resetLogement: assign({
      currentLogementIndex: () => 0
    }),

    nextLogement: assign({
      currentLogementIndex: ({context}) => context.currentLogementIndex + 1
    }),

    // Ajoute l'épisode au calendrier et change le contexte lastEpisode, si un parametre start est spécifié alors le privilégier, sinon utiliser context.lastEpisode.end
    addCalendarEpisode: assign ({
      lastEpisode: ({context, event}, params) => {
        let defaultStart = context.lastEpisode?.end;
        let defaultEnd = 0;
        let endDate = 0;
        let startDate = 0;
        
        if(params?.start == "timeline_init"){
          startDate = timeline.options.start;
          // Pour la commune de naissance, mettre la fin à la fin de la timeline par défaut
          defaultEnd = timeline.options.end;
        }
        
        // Si l'événement contient "start", c'est une année d'arrivée ou un âge
        if(event.start){
          // Parser la valeur pour extraire le nombre (gère "12 ans", "12", "2010", etc.)
          let value = event.start.toString().trim();
          // Extraire le premier nombre de la chaîne
          let match = value.match(/\d+/);
          if (match) {
            let num = parseInt(match[0]);
            
            // Déterminer si c'est un âge ou une année
            // Si < 200, on considère que c'est un âge, sinon c'est une année
            if (num < 200) {
              // C'est un âge, convertir en année
              let year = context.birthYear + num;
              startDate = new Date(`${year}-01-01`);
            } else {
              // C'est une année directement
              startDate = new Date(`${num}-01-01`);
            }
          }
        }
        
        // Vérifier si le groupe existe et a des dépendances
        const currentGroup = groups.get(context.group);
        
        if(currentGroup && currentGroup.dependsOn){
          // Pour les logements (groupe 12), toujours utiliser currentCommuneIndex pour trouver la bonne commune
          if (context.group === 12 && currentGroup.dependsOn === 13) {
            let filteritems = (items.get()).filter(i => i.group == currentGroup.dependsOn);
            let parentItem = filteritems[context.currentCommuneIndex];
            
            if (parentItem) {
              defaultStart = parentItem.start;
              defaultEnd = parentItem.end;
            }
          }
          // Si lastEpisode est du groupe parent, l'utiliser directement (pour les autres groupes)
          else if (context.lastEpisode && context.lastEpisode.group === currentGroup.dependsOn) {
            defaultStart = context.lastEpisode.start;
            defaultEnd = context.lastEpisode.end;
          } else {
            // Chercher le parent approprié - prendre le dernier item du groupe parent
            let filteritems = (items.get()).filter(i => i.group == currentGroup.dependsOn)
            
            let parentItem = filteritems.length > 0 ? filteritems[filteritems.length - 1] : null;
            
            if (parentItem) {
              defaultStart = parentItem.start
              defaultEnd = parentItem.end
            }
          }
        }
        
        // Déterminer le contenu de l'épisode
        let content;
        if (event.type == "ANSWER_BIRTH_COMMUNE") {
          content = event.commune[0];
        } else if (event.commune) {
          content = event.commune;
        } else if (event.statut_res) {
          content = event.statut_res;
        } else if (event.type === "YES" && context.group === 12) {
          // Pour "même logement", utiliser un libellé descriptif
          content = "Logement unique";
        } else if (context.group === 12 && context.logements && context.logements.length > 0) {
          // Pour un logement spécifique, utiliser le nom du logement
          content = context.logements[context.currentLogementIndex];
        } else {
          // Utiliser la commune courante du contexte
          content = context.communes[context.currentCommuneIndex];
        }
        
        let truc = ajouterEpisode(content, startDate || defaultStart, endDate || defaultEnd, context.group);
        return truc
      }
    }),

    // TODO : PB ordre si j'entre pau puis grenoble dans l'input et que je place en premier grenoble puis que je place pau, dans ma statemachine j'aurais ['Pau','Grenoble'] mais l'ordre correspond pas, les questions liés sont inversés : "locataire dans pau -> va tag grenoble"
    // Modifie l'épisode du calendrier et change le contexte lastEpisode TODO POUR CA IL FAUT MODIFIER QUESTIONNAIREJS POUR CHANGER LE SEND COMMUNE
    modifyCalendarEpisode: assign ({
      lastEpisode: ({context, event}, params) => {
        // Vérifier que lastEpisode existe avant de l'utiliser
        if (!context.lastEpisode || !context.lastEpisode.id) {
          console.warn('⚠️ lastEpisode est null dans modifyCalendarEpisode');
          return null;
        }
        
        if(params){
          return modifierEpisode(context.lastEpisode.id, params);
        }
        
        // Parser les modifications pour convertir âge→année si nécessaire
        const { type, ...modifs } = event;
        
        // Si on a un 'end' qui est une chaîne (âge ou année), le parser
        if (modifs.end && typeof modifs.end === 'string') {
          let value = modifs.end.toString().trim();
          let match = value.match(/\d+/);
          if (match) {
            let num = parseInt(match[0]);
            
            if (num < 200) {
              // C'est un âge, convertir en année
              let year = context.birthYear + num;
              modifs.end = new Date(`${year}-01-01`);
            } else {
              // C'est une année directement
              modifs.end = new Date(`${num}-01-01`);
            }
          }
        }
        
        // Même chose pour 'start' si présent
        if (modifs.start && typeof modifs.start === 'string') {
          let value = modifs.start.toString().trim();
          let match = value.match(/\d+/);
          if (match) {
            let num = parseInt(match[0]);
            
            if (num < 200) {
              let year = context.birthYear + num;
              modifs.start = new Date(`${year}-01-01`);
            } else {
              modifs.start = new Date(`${num}-01-01`);
            }
          }
        }
        
        // Vérifier que lastEpisode existe avant de l'utiliser
        if (!context.lastEpisode || !context.lastEpisode.id) {
          console.warn('⚠️ lastEpisode est null, impossible de modifier l\'épisode');
          return null;
        }
        
        return modifierEpisode(context.lastEpisode.id, modifs);
        
      }
    }),

    closePreviousCommuneEpisode: ({context, event}) => {
      // Fermer l'épisode de la commune précédente à la date d'arrivée dans la nouvelle
      const allItems = items.get();
      // Trouver tous les épisodes de communes (group 13)
      const communeEpisodes = allItems.filter(i => i.group === 13);
      
      // Prendre le dernier épisode créé (le plus récent dans le tableau)
      if (communeEpisodes.length > 0 && event.start) {
        const lastCommuneEpisode = communeEpisodes[communeEpisodes.length - 1];
        const arrivalDate = new Date(`${event.start}-01-01`);
        modifierEpisode(lastCommuneEpisode.id, { end: arrivalDate });
      }
    },

    extendPreviousCalendarEpisode:({context, event}) => {
      
      const { type, ...modifs } = event;
      if (modifs.hasOwnProperty('start')) {
        modifs.end = modifs.start;
        delete modifs.start;
      }
      let previousEp =(items.get())[context.currentCommuneIndex-1]
      let truc = modifierEpisode(previousEp.id,modifs)
      return truc
    },

    setupCalendar: ({context, event}) => {
      timeline.setOptions({min: new Date(`${event.birthdate}-01-01`), start: new Date(`${event.birthdate}-01-01`)})
      timeline.setOptions({
        format:{
          minorLabels: function(date, scale, step) {
            // Tu peux ici modifier le format comme tu veux
            switch (scale) {
              case 'millisecond':
                return vis.moment(date).format('SSS');
              case 'second':
                return vis.moment(date).format('s');
              case 'minute':
                return vis.moment(date).format('HH:mm');
              case 'hour':
                return vis.moment(date).format('HH:mm');
              case 'weekday':
                return vis.moment(date).format('ddd D');
              case 'day':
                return vis.moment(date).format('D');
              case 'week':
                return vis.moment(date).format('w');
              case 'month':
                return vis.moment(date).format('MMM');
              case 'year':
                const age = new Date(date).getFullYear() - new Date(timeline.options.start).getFullYear()
                return '<b>'+new Date(date).getFullYear() + '</b></br><b>'+ age + `</b> ${age != 0 && age != 1 ? 'ans' : 'an'}`
                
              default:
                return '';
            }
          }
        }
        
      });
    },

    splitHousingEpisode: assign({
      lastEpisode: ({context, event}) => {
        // Récupérer l'épisode à split
        const episodeToSplit = context.lastEpisode;
        const splitYear = parseInt(event.split);
        
        // Calculer les dates
        const startDate = new Date(episodeToSplit.start);
        const endDate = new Date(episodeToSplit.end);
        const splitDate = new Date(splitYear, 0, 1); // 1er janvier de l'année de déménagement
        
        // Modifier l'épisode existant (premier logement)
        modifierEpisode(episodeToSplit.id, {
          end: splitDate
        });
        
        // Ajouter le second logement
        const secondEpisode = ajouterEpisode(
          episodeToSplit.content,
          splitDate,
          endDate,
          episodeToSplit.group
        );
        
        return secondEpisode;
      }
    }),

    nextCommune: assign({
      currentCommuneIndex: ({context, event}) => {
        return context.currentCommuneIndex + 1
      }
    }),

    resetCommune: assign({
      currentCommuneIndex: ({context, event}) => {
        return 0
      }
    }),

    nextGroup: assign({ //A Modifier, marche que pour 14,13,12,11
      group: ({context, event}) => {
        return context.group -1
      }
    }),

    previousGroup: assign({
      group: ({context, event}) => {
        return context.group +1
      }
    })
  },
  guards: {
    hasMoreCommunesToPlace: (context) => {
      // Pour le placement initial des communes sur la timeline
      // On vérifie si l'index actuel est encore dans le tableau
      const result = context.context.currentCommuneIndex < context.context.communes.length;
      return result;
    },
    moreCommunesToProcess: (context) => {
      // Pour le traitement des logements
      // On vient de terminer la commune à currentCommuneIndex
      // On vérifie s'il reste des communes NON encore traitées
      const result = context.context.currentCommuneIndex + 1 < context.context.communes.length;
      return result;
    },
    moreLogementsToProcess: (context) => {
      const result = context.context.currentLogementIndex < context.context.logements.length - 1;
      return result;
    }
  }
});

// Créer le service et le configurer avec les données sauvegardées
export const surveyService = interpret(surveyMachine);

// Fonction pour initialiser le service avec l'état sauvegardé
export function initializeSurveyService() {
  // Démarrer le service (l'état initial est déjà configuré dans la machine)
  surveyService.start();
  
  // 🆕 IMPORTANT : Restaurer lastEpisode APRÈS le démarrage
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
  }
  
  // Sauvegarder le contexte après chaque transition
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
  
  // Sauvegarder dans localStorage (pour persistance)
  saveContext(remoteState.context, remoteState.value);
  
  // Arrêter le service actuel
  surveyService.stop();
  
  // Redémarrer avec le nouvel état
  surveyService.start({
    value: remoteState.value,
    context: remoteState.context
  });
}

// Exporter pour que questionnaire.js puisse l'utiliser
export { savedContext, savedState };

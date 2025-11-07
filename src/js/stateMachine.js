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

export const surveyMachine = createMachine({
  id: 'survey',
  initial: 'askBirthYear',
  context: {
    birthYear: 0,
    birthPlace: '',           // Lieu de naissance des parents
    communes: [],             // Liste des communes
    departements: [],         // Liste des départements/pays associés
    currentCommuneIndex: 0,
    logements: [],            // Liste des logements par commune
    currentLogementIndex: 0,
    group: 13,
    lastEpisode: null,
  },
  states: {
    askBirthYear: {
      on: {
        ANSWER_BIRTH_YEAR: {
          actions: ['setupCalendar'],
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
            }
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
            'addMultipleCommunes',
            'resetCommune',
            'nextGroup'
          ],
          target: 'placeNextCommuneOnTimeline'
        }
      }
    },

    placeNextCommuneOnTimeline: {
      always: [
        {
          guard: 'moreCommunesToProcess',
          actions: ['nextCommune'],
          target: 'askCommuneArrivalYear'
        },
        {
          target: 'askSameHousingInCommune'
        }
      ]
    },

    askCommuneArrivalYear: {
      on: {
        ANSWER_COMMUNE_ARRIVAL: {
          actions: ['addCalendarEpisode'],
          target: 'askCommuneDepartureYear'
        }
      }
    },

    askCommuneDepartureYear: {
      on: {
        ANSWER_COMMUNE_DEPARTURE: {
          actions: ['modifyCalendarEpisode'],
          target: 'placeNextCommuneOnTimeline'
        }
      }
    },

    askSameHousingInCommune: {
      on: {
        YES: {
          actions: ['addCalendarEpisode'],
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
      on: {
        ANSWER_STATUS_ENTRY: {
          actions: ['nextGroup', 'addCalendarEpisode'],
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
      always: [
        {
          guard: 'moreLogementsToProcess',
          actions: ['nextLogement'],
          target: 'askHousingArrivalAge'
        },
        {
          guard: 'moreCommunesToProcess',
          actions: ['nextCommune', 'previousGroup'],
          target: 'askSameHousingInCommune'
        },
        {
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
        // Pour simplifier, on ajoute juste les communes pour l'instant
        return [...context.communes, ...event.communes];
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

    addCommune: assign({
      communes: ({context, event}) => {
        return [...context.communes, ...event.commune];
      }
    }),

    addLogement: assign({
      communes: ({context, event}) => {
        return
      }
    }),

    // Ajoute l'épisode au calendrier et change le contexte lastEpisode, si un parametre start est spécifié alors le privilégier, sinon utiliser context.lastEpisode.end
    addCalendarEpisode: assign ({
      lastEpisode: ({context, event}, params) => {
        let defaultStart = context.lastEpisode?.end;
        let defaultEnd = 0;
        let endDate = 0;
        let startDate = 0;
        
        if(params?.start == "timeline_init"){
          startDate = timeline.options.start
        }
        
        if(groups.get(context.group).dependsOn){
          let filteritems = (items.get()).filter(i => i.group == groups.get(context.group).dependsOn)
          defaultStart = filteritems[context.currentCommuneIndex].start
          defaultEnd = filteritems[context.currentCommuneIndex].end
        }
        let trick = event.type == "ANSWER_BIRTH_COMMUNE" ? event.commune[0] : event.commune//trick addfirstquestion
        let truc = ajouterEpisode(trick||event.statut_res, startDate || defaultStart, endDate || defaultEnd,context.group);
        return truc
      }
    }),

    // TODO : PB ordre si j'entre pau puis grenoble dans l'input et que je place en premier grenoble puis que je place pau, dans ma statemachine j'aurais ['Pau','Grenoble'] mais l'ordre correspond pas, les questions liés sont inversés : "locataire dans pau -> va tag grenoble"
    // Modifie l'épisode du calendrier et change le contexte lastEpisode TODO POUR CA IL FAUT MODIFIER QUESTIONNAIREJS POUR CHANGER LE SEND COMMUNE
    modifyCalendarEpisode: assign ({
      lastEpisode: ({context, event}, params) => {
        if(params){
          return modifierEpisode(context.lastEpisode.id, params);
        }
        const { type, ...modifs } = event;
        return modifierEpisode(context.lastEpisode.id,modifs);
        
      }
    }),

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
    moreCommunesToProcess: (context) => {
      return context.context.currentCommuneIndex < context.context.communes.length - 1
    },
    moreLogementsToProcess: (context) => {
      return context.context.currentLogementIndex < context.context.logements.length - 1
    }
  }
});

export const surveyService = interpret(surveyMachine);

import { createMachine, interpret, assign } from "../libs/xstate/xstate.js";
import { ajouterEpisode, modifierEpisode } from "./episodes.js"
import { timeline, groups, items } from "./timeline.js";

// Nouvelle classe pour gérer les réponses live
class LiveResponseManager {
    constructor() {
        this.responses = this.loadResponses();
    }

    loadResponses() {
        const saved = localStorage.getItem('survey-live-responses');
        return saved ? JSON.parse(saved) : {};
    }

    saveResponse(questionType, answer) {
        this.responses[questionType] = {
            answer: answer,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('survey-live-responses', JSON.stringify(this.responses));
        console.log('💾 Réponse sauvegardée:', questionType, answer);
    }

    getAllResponses() {
        return this.responses;
    }

    exportToJSON() {
        const data = {
            responses: this.responses,
            exportDate: new Date().toISOString(),
            type: 'live-survey'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `survey-live-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    reset() {
        this.responses = {};
        localStorage.removeItem('survey-live-responses');
    }
}

// Instance globale du gestionnaire de réponses live
export const liveResponseManager = new LiveResponseManager();

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
    communes: [],
    currentCommuneIndex: 0,
    group: 13,
    lastEpisode: null,
    isLiveMode: false, // 🆕 Nouveau flag pour le mode live
  },
  states: {
    askBirthYear: {
      on: {
        ANSWER_BIRTH_YEAR: [
          {
            // Si c'est 2001, mode préloaded normal
            guard: 'isPreloadedYear',
            actions: ['setupCalendar'],
            target: 'askBirthCommune'
          },
          {
            // Sinon, mode live
            actions: ['setupCalendar', 'enableLiveMode', 'saveLiveResponse'],
            target: 'askBirthCommune'
          }
        ]
      }
    },
    
    askBirthCommune: {
      on: {
        ANSWER_BIRTH_COMMUNE: [
          {
            // Mode préloaded normal
            guard: 'isNotLiveMode',
            actions: [
              'addCommune',
              {
                type: 'addCalendarEpisode', params: {start: "timeline_init"}
              },
            ],
            target: 'askAlwaysLivedThere'
          },
          {
            // Mode live
            actions: [
              'saveLiveResponse',
              'addCommune',
              {
                type: 'addCalendarEpisode', params: {start: "timeline_init"}
              },
            ],
            target: 'askAlwaysLivedThere'
          }
        ]
      }
    },
    askAlwaysLivedThere: {
      on: {
        YES: [
          {
            guard: 'isNotLiveMode',
            actions: [
              {
                type: 'modifyCalendarEpisode', params: {end: timeline.options.end}
              },
              'resetCommune',
              'nextGroup'
            ],
            target: 'askSameHousing',
          },
          {
            // Mode live
            actions: [
              'saveLiveResponse',
              {
                type: 'modifyCalendarEpisode', params: {end: timeline.options.end}
              },
              'resetCommune',
              'nextGroup'
            ],
            target: 'askSameHousing',
          }
        ],
        NO: [
          {
            guard: 'isNotLiveMode',
            target: 'askNewCommune'
          },
          {
            // Mode live
            actions: ['saveLiveResponse'],
            target: 'askNewCommune'
          }
        ]
      }
    },
    askNewCommune: {
      on: {
        ANSWER_NEW_COMMUNE: [
          {
            guard: 'isNotLiveMode',
            actions: [
              'addCommune',
              'resetCommune',
              'nextGroup',
            ],
            target: 'askSameHousing'
          },
          {
            // Mode live
            actions: [
              'saveLiveResponse',
              'addCommune',
              'resetCommune',
              'nextGroup',
            ],
            target: 'askSameHousing'
          }
        ]
      }
    },
    askArrivalYear: {
      on: {
        ANSWER_ARRIVAL_YEAR: {
          actions: [
            'extendPreviousCalendarEpisode',
            'modifyCalendarEpisode',
          ],
          target: 'askAlwaysLivedThere'
        }
      }
    },
    askSameHousing: {
      on: {
        YES: [
          {
            guard: 'isNotLiveMode',
            actions: [
              'addCalendarEpisode',
            ],
            target: 'askHousingStatus'
          },
          {
            // Mode live
            actions: [
              'saveLiveResponse',
              'addCalendarEpisode',
            ],
            target: 'askHousingStatus'
          }
        ],
        NO: [
          {
            guard: 'isNotLiveMode',
            actions: [
              'addCalendarEpisode'
            ],
            target: 'askSplitHousing'
          },
          {
            // Mode live
            actions: [
              'saveLiveResponse',
              'addCalendarEpisode'
            ],
            target: 'askSplitHousing'
          }
        ]
      }
    },
    askSplitHousing: {
      on: {
        ANSWER_HOUSING_SPLIT_YEAR: {
          actions: [
            'splitHousingEpisode'
          ],
          target: 'askHousingStatus'
        }
      }
    },
    askHousingArrivalYear: {
      on: {
        ANSWER_HOUSING_ARRIVAL_YEAR: {
          actions: [
            'modifyCalendarEpisode'
          ],
          target: 'askHousingDepartureYear'
        }
      }
    },
    askHousingDepartureYear: {
      on: {
        ANSWER_HOUSING_DEPARTURE_YEAR: {
          actions: [
            'modifyCalendarEpisode',
          ],
          target: 'askHousingStatus'
        }
      }
    },
    askHousingStatus: {
      on: {
        LOCATAIRE: [
          {
            guard: 'isNotLiveMode',
            actions: [
              'nextGroup',
              'addCalendarEpisode'
            ],
            target: 'askChangeHousingStatus'
          },
          {
            // Mode live
            actions: [
              'saveLiveResponse',
              'nextGroup',
              'addCalendarEpisode'
            ],
            target: 'askChangeHousingStatus'
          }
        ],
        PROPRIETAIRE: [
          {
            guard: 'isNotLiveMode',
            actions: [
              'nextGroup',
              'addCalendarEpisode'
            ],
            target: 'askChangeHousingStatus'
          },
          {
            // Mode live
            actions: [
              'saveLiveResponse',
              'nextGroup',
              'addCalendarEpisode'
            ],
            target: 'askChangeHousingStatus'
          }
        ]
      }
    },
    askChangeHousingStatus: {
      on: {
        YES: 'surveyComplete',
        NO: [
          {
            guard: 'moreCommunesToProcess',
            actions: [
              'previousGroup',
              'nextCommune',
            ],
            target: 'askSameHousing', // a changer
          },
          {
            target: 'surveyComplete',
          }
        ]
      }
    },
    surveyComplete: {
      type: 'final',
      entry: [
        {
          guard: 'isLiveMode',
          actions: 'exportLiveResponses'
        }
      ]
    }
  }
}, {
  actions: {
    // 🆕 Nouvelle action pour activer le mode live
    enableLiveMode: assign({
      isLiveMode: () => true
    }),

    // 🆕 Nouvelle action pour sauvegarder les réponses live
    saveLiveResponse: ({context, event}) => {
      if (context.isLiveMode) {
        // Déterminer le type de question basé sur l'événement
        let questionType = event.type.replace('ANSWER_', '').toLowerCase();
        let answer = event.commune || event.statut_res || event.birthdate || 'yes/no';
        
        liveResponseManager.saveResponse(questionType, answer);
      }
    },

    // 🆕 Action pour exporter automatiquement à la fin
    exportLiveResponses: () => {
      console.log('📁 Export automatique des réponses live');
      liveResponseManager.exportToJSON();
    },

    addCommune: assign({
      communes: ({context, event}) => {
        console.log(event);  // Vérifier ce qui est ajouté
        //ajouterEpisode(context.event.value,context.context.episodeStartDate,0,)
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
          console.log(context.group)
          console.log(context.currentCommuneIndex)
          let filteritems = (items.get()).filter(i => i.group == groups.get(context.group).dependsOn)
          console.log(filteritems)
          defaultStart = filteritems[context.currentCommuneIndex].start
          defaultEnd = filteritems[context.currentCommuneIndex].end
        }
        console.log(timeline.options.start)
        let trick = event.type == "ANSWER_BIRTH_COMMUNE" ? event.commune[0] : event.commune//trick addfirstquestion
        let truc = ajouterEpisode(trick||event.statut_res, startDate || defaultStart, endDate || defaultEnd,context.group);
        console.log(items.get())
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
        console.log(modifs)
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
      console.log(truc)
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
        console.log("before:",context.currentCommuneIndex)
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
    // 🆕 Guard pour détecter si c'est l'année préloaded (2001)
    isPreloadedYear: ({context, event}) => {
      return event.birthdate === '2001';
    },

    // 🆕 Guard pour vérifier si on est en mode live
    isLiveMode: ({context}) => {
      return context.isLiveMode;
    },

    // 🆕 Guard pour vérifier si on n'est PAS en mode live
    isNotLiveMode: ({context}) => {
      return !context.isLiveMode;
    },

    moreCommunesToProcess: (context) => {
      return context.context.currentCommuneIndex < context.context.communes.length - 1
    }
  }
});

export const surveyService = interpret(surveyMachine);

import { createMachine, interpret, assign } from "../libs/xstate/xstate.js";
import { ajouterEpisode, modifierEpisode } from "./episodes.js"
import { timeline, groups, items } from "./timeline.js";

/**
 * Gestionnaire des réponses en mode live
 * Sauvegarde toutes les réponses du questionnaire dans localStorage
 * et permet l'export complet incluant les épisodes de la timeline
 * 
 * @class LiveResponseManager
 */
class LiveResponseManager {
    constructor() {
        this.responses = this.loadResponses();
        console.log('🎯 LiveResponseManager initialisé');
    }

    /**
     * Charge les réponses depuis localStorage
     * @returns {Object} Objet contenant toutes les réponses sauvegardées
     */
    loadResponses() {
        const saved = localStorage.getItem('survey-live-responses');
        const responses = saved ? JSON.parse(saved) : {};
        console.log('📂 Réponses chargées:', Object.keys(responses).length, 'questions');
        return responses;
    }

    /**
     * Sauvegarde une réponse dans localStorage
     * @param {string} questionType - Type de question (ex: 'birth_year', 'birth_commune')
     * @param {any} answer - Réponse à sauvegarder (peut être string, array, number)
     */
    saveResponse(questionType, answer) {
        this.responses[questionType] = {
            answer: answer,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('survey-live-responses', JSON.stringify(this.responses));
        console.log('💾 Réponse sauvegardée:', questionType, '→', answer);
    }

    /**
     * Récupère toutes les réponses
     * @returns {Object} Toutes les réponses sauvegardées
     */
    getAllResponses() {
        return this.responses;
    }

    /**
     * Récupère les épisodes depuis la timeline
     * @returns {Array} Tableau d'épisodes avec leurs propriétés
     */
    getTimelineEpisodes() {
        const allItems = items.get();
        console.log('📅 Récupération épisodes timeline:', allItems.length, 'épisodes');
        
        return allItems.map(item => ({
            id: item.id,
            content: item.content,
            start: item.start,
            end: item.end,
            group: item.group,
            type: item.type,
            className: item.className
        }));
    }

    /**
     * Récupère les groupes depuis la timeline
     * @returns {Array} Tableau des groupes avec leurs propriétés
     */
    getTimelineGroups() {
        const allGroups = groups.get();
        console.log('🏘️ Récupération groupes timeline:', allGroups.length, 'groupes');
        
        return allGroups.map(group => ({
            id: group.id,
            content: group.content,
            order: group.order,
            dependsOn: group.dependsOn
        }));
    }

    /**
     * Prépare les données complètes pour l'export
     * Inclut réponses, épisodes, groupes et métadonnées
     * @returns {Object} Données structurées prêtes pour l'export
     */
    getExportData() {
        const data = {
            // Métadonnées
            metadata: {
                exportDate: new Date().toISOString(),
                type: 'live-survey',
                version: '1.0',
                source: 'LifeStories-Live'
            },
            
            // Réponses du questionnaire
            responses: this.responses,
            
            // Épisodes de la timeline
            episodes: this.getTimelineEpisodes(),
            
            // Groupes de la timeline
            groups: this.getTimelineGroups(),
            
            // Configuration de la timeline
            timelineConfig: {
                start: timeline.options?.start,
                end: timeline.options?.end,
                min: timeline.options?.min,
                max: timeline.options?.max
            },
            
            // Statistiques
            statistics: {
                totalResponses: Object.keys(this.responses).length,
                totalEpisodes: items.get().length,
                totalGroups: groups.get().length
            }
        };
        
        console.log('📊 Données export préparées:', {
            responses: data.statistics.totalResponses,
            episodes: data.statistics.totalEpisodes,
            groups: data.statistics.totalGroups
        });
        
        return data;
    }

    /**
     * Exporte toutes les données (réponses + timeline) en JSON
     * Télécharge automatiquement le fichier
     */
    exportToJSON() {
        console.log('📁 Démarrage export JSON complet...');
        
        const data = this.getExportData();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        a.download = `lifestories-live-${timestamp}.json`;
        
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('✅ Export terminé:', a.download);
        console.log('📦 Contenu exporté:', {
            réponses: data.statistics.totalResponses,
            épisodes: data.statistics.totalEpisodes,
            groupes: data.statistics.totalGroups
        });
    }

    /**
     * Réinitialise toutes les données
     * Supprime les réponses de localStorage
     */
    reset() {
        this.responses = {};
        localStorage.removeItem('survey-live-responses');
        console.log('🗑️ LiveResponseManager réinitialisé');
    }
}

// Instance globale du gestionnaire de réponses live
export const liveResponseManager = new LiveResponseManager();

/**
 * HELPER: Calcule les dates par défaut pour un groupe donné
 * Essaie d'abord de trouver dans items existants (mode dataset)
 * Sinon fallback sur timeline.options.start ou context.lastEpisode
 * 
 * @param {Object} context - Contexte de la state machine
 * @param {number} group - Numéro du groupe
 * @returns {Object} { start: Date|null, end: Date|null }
 */
function getDefaultDatesForGroup(context, group) {
    // 1️⃣ Essayer de trouver dans items existants (mode dataset)
    const groupConfig = groups.get(group);
    
    if (groupConfig?.dependsOn) {
        const dependsOnGroup = groupConfig.dependsOn;
        const filteritems = items.get().filter(i => i.group === dependsOnGroup);
        
        console.log(`🔍 Recherche dates pour groupe ${group} (dépend de ${dependsOnGroup})`);
        console.log(`   Items trouvés:`, filteritems.length);
        
        // Vérifier si on a un item à l'index voulu
        if (filteritems.length > 0 && filteritems[context.currentCommuneIndex]) {
            const foundItem = filteritems[context.currentCommuneIndex];
            console.log(`✅ Dates trouvées dans items existants:`, {
                start: foundItem.start,
                end: foundItem.end,
                source: 'dataset'
            });
            return {
                start: foundItem.start,
                end: foundItem.end
            };
        } else {
            console.log(`⚠️ Aucun item trouvé à l'index ${context.currentCommuneIndex}, fallback...`);
        }
    }
    
    // 2️⃣ Fallback : utiliser lastEpisode.end comme start
    if (context.lastEpisode?.end) {
        console.log(`📍 Fallback sur lastEpisode.end:`, context.lastEpisode.end);
        return {
            start: context.lastEpisode.end,
            end: null  // Sera calculé automatiquement par ajouterEpisode (+1an)
        };
    }
    
    // 3️⃣ Fallback : utiliser timeline.options.start (année de naissance)
    if (timeline.options?.start) {
        console.log(`📅 Fallback sur timeline.options.start:`, timeline.options.start);
        return {
            start: timeline.options.start,
            end: null
        };
    }
    
    // 4️⃣ Dernier recours : date actuelle
    console.warn(`⚠️ Aucune date par défaut trouvée, utilisation de la date actuelle`);
    return {
        start: new Date(),
        end: null
    };
}

/**
 * HELPER: Synchronise l'ordre des communes avec l'ordre chronologique de la timeline
 * Parcourt les items de la timeline, trouve ceux qui correspondent au groupe actuel,
 * et retourne leurs noms dans l'ordre chronologique (tri par date start)
 * 
 * @param {Array<string>} inputCommunes - Liste des communes saisies (peut être dans le désordre)
 * @param {number} group - Numéro du groupe à filtrer
 * @returns {Array<string>} Communes triées par ordre chronologique
 */
function synchronizeCommunesWithTimeline(inputCommunes, group) {
    console.log('🔄 Synchronisation ordre communes avec timeline...');
    console.log('   Input:', inputCommunes, 'Groupe:', group);
    
    // Récupérer tous les items du groupe
    const groupItems = items.get().filter(i => i.group === group);
    
    if (groupItems.length === 0) {
        console.log('   ⚠️ Aucun item trouvé, on garde l\'ordre de saisie');
        return inputCommunes;
    }
    
    // Filtrer seulement les items qui correspondent aux communes saisies
    const relevantItems = groupItems.filter(item => 
        inputCommunes.includes(item.content)
    );
    
    // Trier par date de début (ordre chronologique)
    relevantItems.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    // Extraire les noms des communes dans le bon ordre
    const sortedCommunes = relevantItems.map(item => item.content);
    
    console.log('   ✅ Ordre synchronisé:', sortedCommunes);
    return sortedCommunes;
}

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
        console.log('📍 Ajout communes:', event);
        
        // Fusionner les nouvelles communes avec les existantes
        const mergedCommunes = [...context.communes, ...event.commune];
        
        // 🔄 Synchroniser immédiatement avec l'ordre de la timeline
        // Note: À ce stade, les items ne sont pas encore créés, donc on garde l'ordre de saisie
        // La synchronisation réelle se fera après addCalendarEpisode
        console.log('📝 Communes ajoutées (ordre de saisie):', mergedCommunes);
        
        return mergedCommunes;
      }
    }),

    addLogement: assign({
      communes: ({context, event}) => {
        return
      }
    }),

    // Ajoute l'épisode au calendrier et change le contexte lastEpisode
    // ✅ Synchronise automatiquement l'ordre des communes avec la timeline
    addCalendarEpisode: assign ({
      lastEpisode: ({context, event}, params) => {
        let defaultStart = context.lastEpisode?.end;
        let defaultEnd = null;  // ✅ Remplacé 0 par null
        let endDate = null;     // ✅ Remplacé 0 par null
        let startDate = null;   // ✅ Remplacé 0 par null
        
        // Si param spécial "timeline_init", utiliser le début de la timeline
        if(params?.start === "timeline_init"){
          startDate = timeline.options.start;
          console.log('🎬 Initialisation timeline, start:', startDate);
        }
        
        // ✅ NOUVELLE LOGIQUE: Utiliser le helper pour obtenir dates par défaut
        const defaultDates = getDefaultDatesForGroup(context, context.group);
        if (defaultDates) {
          defaultStart = defaultDates.start;
          defaultEnd = defaultDates.end;
        }
        
        console.log('📊 Dates calculées:', {
          startDate,
          defaultStart,
          endDate,
          defaultEnd,
          group: context.group
        });
        
        // Déterminer le contenu de l'épisode selon le type d'événement
        let episodeContent;
        
        if (event.type === "ANSWER_BIRTH_COMMUNE") {
          // Commune de naissance : prendre la première commune du array
          episodeContent = event.commune[0];
        } else if (event.commune) {
          // Nouvelle commune : peut être string ou array
          episodeContent = Array.isArray(event.commune) ? event.commune[0] : event.commune;
        } else if (event.statut_res) {
          // Statut résidentiel (LOCATAIRE/PROPRIETAIRE)
          episodeContent = event.statut_res;
        } else if (context.group === 12) {
          // Groupe Logement : utiliser la commune actuelle
          episodeContent = context.communes[context.currentCommuneIndex] || "Logement";
        } else {
          // Fallback
          episodeContent = "Episode";
        }
        
        console.log('📝 Contenu épisode déterminé:', episodeContent, 'pour event:', event.type);
        
        // Ajouter l'épisode avec priorité: startDate || defaultStart
        let truc = ajouterEpisode(
          episodeContent, 
          startDate || defaultStart, 
          endDate || defaultEnd,
          context.group
        );
        
        console.log('✅ Episode ajouté, items actuels:', items.get().length);
        return truc;
      },
      
      // 🔄 NOUVELLE PROPRIÉTÉ: Synchroniser communes après chaque ajout
      communes: ({context, event}) => {
        // Si on n'a pas de communes dans le context, rien à synchroniser
        if (!context.communes || context.communes.length === 0) {
          return context.communes;
        }
        
        // Synchroniser l'ordre avec la timeline réelle
        const synchronized = synchronizeCommunesWithTimeline(context.communes, context.group);
        
        console.log('🔄 Synchronisation post-ajout:');
        console.log('   Avant:', context.communes);
        console.log('   Après:', synchronized);
        
        return synchronized;
      }
    }),

    // ✅ RÉSOLU: L'ordre est maintenant synchronisé automatiquement avec la timeline
    // après chaque ajout d'épisode via synchronizeCommunesWithTimeline()
    // Modifie l'épisode du calendrier et change le contexte lastEpisode
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
    /**
     * Guard pour détecter si c'est l'année préloaded (2001)
     * Cette année spéciale indique qu'on veut charger le dataset de démonstration
     * 
     * @param {Object} event - Événement contenant event.birthdate
     * @returns {boolean} true si l'année est exactement 2001
     * 
     * @example
     * birthdate = "2001" → true (mode dataset)
     * birthdate = "2001-01-01" → true (extrait l'année)
     * birthdate = "1990" → false (mode live)
     * 
     * Formats acceptés:
     * - Nombre: 2001
     * - String: "2001"
     * - Date ISO: "2001-01-01"
     */
    isPreloadedYear: ({context, event}) => {
      // Accept numeric or string year values (e.g. 2001, '2001', '2001-01-01')
      if (!event || !event.birthdate) return false;
      const raw = String(event.birthdate).trim();
      // If user provided a full date like '2001-01-01', extract the year
      const yearMatch = raw.match(/^(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : parseInt(raw, 10);
      const isPreloaded = Number.isFinite(year) && year === 2001;
      
      console.log('🔍 Vérification année préloaded:', {
        input: event.birthdate,
        parsedYear: year,
        isPreloaded
      });
      
      return isPreloaded;
    },

    /**
     * Guard pour vérifier si on est en MODE LIVE
     * Le mode live est activé quand l'année de naissance n'est PAS 2001
     * Dans ce mode, les réponses sont sauvegardées dans localStorage
     * 
     * @param {Object} context - Contexte de la state machine
     * @returns {boolean} true si context.isLiveMode === true
     * 
     * Utilisé pour:
     * - Déclencher l'export automatique à la fin du questionnaire
     * - Activer la sauvegarde des réponses
     */
    isLiveMode: ({context}) => {
      return context.isLiveMode;
    },

    /**
     * Guard pour vérifier si on N'est PAS en mode live (mode dataset)
     * Le mode dataset est activé avec l'année 2001
     * Dans ce mode, on utilise les données préchargées de enquete.json
     * 
     * @param {Object} context - Contexte de la state machine
     * @returns {boolean} true si context.isLiveMode === false
     * 
     * Utilisé pour:
     * - Sauter la sauvegarde des réponses (déjà dans le dataset)
     * - Utiliser les données préexistantes de la timeline
     */
    isNotLiveMode: ({context}) => {
      return !context.isLiveMode;
    },

    /**
     * Guard pour vérifier s'il reste des communes à traiter
     * Utilisé dans la boucle de questions sur les communes
     * 
     * @param {Object} context - Contexte de la state machine
     * @returns {boolean} true si currentCommuneIndex < communes.length - 1
     * 
     * @example
     * communes = ["Pau", "Grenoble", "Lyon"]
     * currentCommuneIndex = 0 → true (il reste Grenoble et Lyon)
     * currentCommuneIndex = 1 → true (il reste Lyon)
     * currentCommuneIndex = 2 → false (dernière commune)
     */
    moreCommunesToProcess: ({context}) => {
      const hasMore = context.currentCommuneIndex < context.communes.length - 1;
      console.log('🔄 Plus de communes à traiter?', {
        currentIndex: context.currentCommuneIndex,
        totalCommunes: context.communes.length,
        communes: context.communes,
        hasMore
      });
      return hasMore;
    }
  }
});

export const surveyService = interpret(surveyMachine);

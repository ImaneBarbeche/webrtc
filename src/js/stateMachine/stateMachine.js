// XState is loaded via UMD as a global window.XState
const { createMachine, interpret, assign } = window.XState;
import { modifierEpisode, ajouterEpisode } from "../episodes/episodes.js";
import { timeline, items } from "../timeline/timeline.js";
import {
  loadSavedContext,
  saveContext,
  saveAnsweredQuestion,
  loadAnsweredQuestions,
  resetAllData,
} from "./persistence.js";
import {
  stateToQuestionMap,
  getQuestionFromState,
} from "./stateToQuestionMap.js";
import {
  defaultContext,
  getLastEpisodeFromTimeline,
  initializeContext,
} from "./context.js";
import { guards } from "./guards.js";
import { actions } from "./actions.js";
/*
 ********************************************************************************
 * stateMachine.js - Main state machine definition                               *
 * Defines all states, transitions, guards, and actions for the survey workflow  *
 ********************************************************************************
 */
// Load initial context and state (restored from localStorage if available)
const { initialContext, initialState, savedContext, savedState } =
  initializeContext();

export const surveyMachine = createMachine(
  {
    id: "survey",
    // Start from restored state if available
    initial: initialState,
    // Use restored context if available
    context: initialContext,

    // Global event handlers (available in all states)
    on: {
      /** * RESTORE_LAST_EPISODE * Used after service startup to reattach the last timeline episode * into the machine context. */
      RESTORE_LAST_EPISODE: {
        actions: assign({
          lastEpisode: ({ event }) => event.lastEpisode,
        }),
      },
      /**
       * UPDATE_ANSWER
       * Allows modifying a previous answer WITHOUT changing state.
       * This is used when editing past answers or timeline episodes.
       */
      UPDATE_ANSWER: {
        actions: assign(({ context, event }) => {
          const updates = {};

          // Update context field
          if (event.key) {
            updates[event.key] = event.value;
          }

          // If modifying a timeline episode
          if (event.updateEpisode) {
            let episodeToUpdate = null;
            // Special case: residential status (group 11)
            if (event.key === "statut_res") {
              const allItems = items.get();
              const statusEpisodes = allItems.filter(
                (item) => item.group === 11
              );
              if (statusEpisodes.length > 0) {
                episodeToUpdate = statusEpisodes[statusEpisodes.length - 1]; // Prendre le dernier
              }
            } else {
              // Default: use lastEpisode
              episodeToUpdate = context.lastEpisode;
            }

            if (episodeToUpdate) {
              const modifs = {};
              modifs[event.key] = event.value;
              // Apply modification locally (no WebRTC sync here)
              modifierEpisode(episodeToUpdate.id, modifs, false);
            } else {
              console.warn("Aucun épisode trouvé pour la modification");
            }
            // Special case: modifying commune name
          } else if (event.key === "commune") {
            if (event.value && event.value !== "Yes" && event.value !== "No") {
              const allItems = items.get();
              const communeEpisodes = allItems.filter(
                (item) => item.group === 13
              );
              if (communeEpisodes.length > 0) {
                const lastCommuneEpisode =
                  communeEpisodes[communeEpisodes.length - 1];
                modifierEpisode(
                  lastCommuneEpisode.id,
                  { content: event.value },
                  false
                );
              }
            }

            // Update communes[] array so future questions use the new value
            if (context.communes && context.communes.length > 0) {
              const indexToUpdate = context.currentCommuneIndex || 0;
              const newCommunes = [...context.communes];
              newCommunes[indexToUpdate] = event.value;
              updates.communes = newCommunes;
            }
            // Special case: modifying the entire communes[] list
          } else if (event.key === "communes") {
            const allItems = items.get();
            const communeEpisodes = allItems.filter(
              (item) => item.group === 13
            );
            const newCommunes = event.value || [];

            // Remove orphaned commune episodes (except birth commune)
            if (communeEpisodes.length > 1) {
              const episodesToRemove = communeEpisodes.slice(1).filter((ep) => {
                return !newCommunes.includes(ep.content);
              });

              episodesToRemove.forEach((ep) => {
                items.remove(ep.id);
              });

              // Remove child episodes (housing + status)
              const childEpisodes = allItems.filter(
                (item) => item.group === 12 || item.group === 11
              );
              childEpisodes.forEach((ep) => {
                items.remove(ep.id);
              });
            }

            // Reset indexes
            updates.currentCommuneIndex = 0;
            updates.logements = [];
            updates.currentLogementIndex = 0;
          }

          return updates;
        }),
      },
    },
    // ======================================================================== // STATES // ========================================================================
    states: {
      // ---------------------- Birth year ----------------------
      askBirthYear: {
        on: {
          ANSWER_BIRTH_YEAR: {
            actions: ["saveBirthYear", "setupCalendar"],
            target: "birthPlaceIntro",
          },
        },
      },
      // ---------------------- Birthplace intro ----------------------
      birthPlaceIntro: {
        on: {
          NEXT: {
            target: "askCurrentCommune",
          },
        },
      },
      // ---------------------- First commune ----------------------
      askCurrentCommune: {
        on: {
          ANSWER_CURRENT_COMMUNE: {
            actions: ["addCommune"],
            target: "askDepartementOrPays",
          },
        },
      },

      askDepartementOrPays: {
        on: {
          ANSWER_DEPARTEMENT: {
            actions: [
              "addDepartement",
              {
                type: "addCalendarEpisode",
                params: { start: "timeline_init" },
              },
            ],
            target: "askAlwaysLivedInCommune",
          },
        },
      },
      // ---------------------- Always lived in commune? ----------------------
      askAlwaysLivedInCommune: {
        on: {
          YES: {
            actions: [
              {
                type: "modifyCalendarEpisode",
                params: { end: "timeline_end" },
              },
              "nextGroup",
            ],
            target: "askSameHousingInCommune",
          },
          NO: "askBirthCommuneDepartureYear",
        },
      },

      // ---------------------- Departure year from birth commune ----------------------
      askBirthCommuneDepartureYear: {
        on: {
          ANSWER_BIRTH_COMMUNE_DEPARTURE: {
            actions: ["modifyCalendarEpisode"],
            target: "askMultipleCommunes",
          },
        },
      },
      // ---------------------- Multiple communes ----------------------
      askMultipleCommunes: {
        on: {
          ANSWER_MULTIPLE_COMMUNES: {
            actions: ["addMultipleCommunes"],
            target: "placeNextCommuneOnTimeline",
          },
        },
      },

      placeNextCommuneOnTimeline: {
        always: [
          {
            guard: "hasMoreCommunesToPlace",
            target: "askCommuneArrivalYear",
          },
          {
            actions: [
              "nextGroup", // Passer de groupe 13 (commune) à groupe 12 (logement)
              "resetCommune", // Réinitialiser l'index pour recommencer à la première commune
            ],
            target: "askSameHousingInCommune",
          },
        ],
      },

      askCommuneArrivalYear: {
        on: {
          ANSWER_COMMUNE_ARRIVAL: {
            actions: ["addCalendarEpisode"],
            target: "askCommuneDepartureYear",
          },
        },
      },

      askCommuneDepartureYear: {
        on: {
          ANSWER_COMMUNE_DEPARTURE: {
            actions: ["modifyCalendarEpisode", "nextCommune"],
            target: "placeNextCommuneOnTimeline",
          },
        },
      },
      // ---------------------- Housing logic ----------------------
      askSameHousingInCommune: {
        entry: [],
        on: {
          YES: {
            actions: [
              assign({
                logements: ({ context }) => {
                  return ["Logement unique"];
                },
                currentLogementIndex: 0,
              }),
              "addCalendarEpisode", // Créer épisode dans groupe 12 (logement)
            ],
            target: "askHousingOccupationStatusEntry",
          },
          NO: "askMultipleHousings",
        },
      },

      askMultipleHousings: {
        on: {
          ANSWER_MULTIPLE_HOUSINGS: {
            actions: ["addMultipleHousings", "resetLogement"],
            target: "askHousingArrivalAge",
          },
        },
      },

      askHousingArrivalAge: {
        on: {
          ANSWER_HOUSING_ARRIVAL: {
            actions: ["addCalendarEpisode"],
            target: "askHousingDepartureAge",
          },
        },
      },

      askHousingDepartureAge: {
        on: {
          ANSWER_HOUSING_DEPARTURE: {
            actions: ["modifyCalendarEpisode"],
            target: "askHousingOccupationStatusEntry",
          },
        },
      },

      askHousingOccupationStatusEntry: {
        entry: ["nextGroup"],
        on: {
          ANSWER_STATUS_ENTRY: {
            actions: ["addCalendarEpisode"], // Créer épisode dans groupe 11 (statut)
            target: "askHousingOccupationStatusExit",
          },
        },
      },

      askHousingOccupationStatusExit: {
        on: {
          ANSWER_STATUS_EXIT: {
            actions: ["modifyCalendarEpisode"],
            target: "checkMoreHousings",
          },
        },
      },
      // ---------------------- Looping logic ----------------------
      checkMoreHousings: {
        entry: [],
        always: [
          {
            guard: "moreLogementsToProcess",
            actions: [
              "nextLogement",
              "previousGroup", // Remonter de groupe 11 (statut) à groupe 12 (logement)
            ],
            target: "askHousingArrivalAge",
          },
          {
            guard: "moreCommunesToProcess",
            actions: [
              "nextCommune", // Passer à la commune suivante
              "resetLogement", // Réinitialiser l'index des logements pour la prochaine commune
              "previousGroup", // 11 → 12
            ],
            target: "askSameHousingInCommune",
          },
          {
            actions: [],
            target: "surveyComplete",
          },
        ],
      },
      surveyComplete: {
        type: "final",
      },
    },
  },
  {
    actions,
    guards,
  }
);

// ============================================================================ // SERVICE INITIALIZATION // ============================================================================
export let surveyService = interpret(surveyMachine);

// Callback for UI rendering
let renderCallback = null;

export function setRenderCallback(callback) {
  renderCallback = callback;
}
/**
 * Initializes the service, restores lastEpisode, and restores timeline options.
 */
export function initializeSurveyService() {
  surveyService.start();
  // Restore lastEpisode after startup
  if (savedContext && savedState) {
    const lastEpisode = getLastEpisodeFromTimeline();
    if (lastEpisode) {
      surveyService.send({
        type: "RESTORE_LAST_EPISODE",
        lastEpisode: lastEpisode,
      });
    }
  }
  // Restore timeline options if birthYear exists
  if (
    initialContext &&
    initialContext.birthYear &&
    initialContext.birthYear > 0
  ) {
    if (timeline && typeof timeline.setOptions === "function") {
      timeline.setOptions({
        min: new Date(`${initialContext.birthYear}-01-01`),
        start: new Date(`${initialContext.birthYear}-01-01`),
      });

      timeline.setOptions({
        format: {
          minorLabels: function (date, scale, step) {
            switch (scale) {
              case "year":
                const age =
                  new Date(date).getFullYear() - initialContext.birthYear;
                return (
                  "<b>" +
                  new Date(date).getFullYear() +
                  "</b></br><b>" +
                  age +
                  `</b> ${age != 0 && age != 1 ? "ans" : "an"}`
                );
              default:
                return vis.moment(date).format(scale === "month" ? "MMM" : "D");
            }
          },
        },
      });
    } else {
      console.warn(
        "⚠️ Timeline pas encore initialisée ou setOptions non disponible"
      );
    }
  }
  // Persist context after every transition
  surveyService.subscribe((state) => {
    saveContext(state.context, state.value);
  });
}

/**
 * Restores state from a remote peer (WebRTC sync).
 * Used ONLY for real-time synchronization.
 */
export function restoreFromRemoteState(remoteState) {
  try {
    saveContext(remoteState.context, remoteState.value);

    surveyService.stop();

    surveyService.start({
      value: remoteState.value,
      context: remoteState.context,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la synchronisation distante:", error);
  }
}

/**
 * Navigates to a specific state by recreating the machine.
 * Used when editing past answers and needing to "rewind" the flow.
 */
export function navigateToState(
  targetState,
  contextUpdates = {},
  clearQuestionsCallback = null
) {
  try {
    const currentSnapshot = surveyService.getSnapshot();
    const currentContext = currentSnapshot.context;

    const newContext = {
      ...currentContext,
      ...contextUpdates,
      lastEpisode: getLastEpisodeFromTimeline(),
    };

    saveContext(newContext, targetState);

    surveyService.stop();

    const newMachine = createMachine(
      {
        ...surveyMachine.config,
        initial: targetState,
        context: newContext,
      },
      surveyMachine.implementations
    );

    surveyService = interpret(newMachine);

    surveyService.subscribe((state) => {
      saveContext(state.context, state.value);
      if (renderCallback) {
        renderCallback(state);
      }
    });

    if (clearQuestionsCallback) {
      clearQuestionsCallback();
    }

    surveyService.start();

    if (renderCallback) {
      const newState = surveyService.getSnapshot();
      renderCallback(newState);
    }
  } catch (error) {
    console.error("❌ Erreur lors de la navigation:", error);
  }
}

export { savedContext, savedState };

export {
  saveAnsweredQuestion,
  loadAnsweredQuestions,
  resetAllData,
  stateToQuestionMap,
  getQuestionFromState,
};

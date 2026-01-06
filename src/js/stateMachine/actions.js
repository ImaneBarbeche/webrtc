/*
 ********************************************************************************
 * actions.js - State machine actions                                           *
 * Functions that modify the context or produce side effects                    *
 ********************************************************************************
 */

import { ajouterEpisode, modifierEpisode } from "../episodes/episodes.js";
import { timeline, groups, items } from "../timeline/timeline.js";
import { setBirthYear, setupBirthYearButton } from "../timeline/birthYear.js";

const { assign } = window.XState;

// ============================================================================= // SIMPLE ACTIONS (context updates) // ============================================================================= /** * Saves the birth year and updates the timeline age display. * Also initializes the birth-year button used in the UI. */

export const saveBirthYear = assign({
  birthYear: ({ context, event }) => {
    const year = parseInt(event.birthdate);
    setBirthYear(year); // Update global birth year for age calculations
    setupBirthYearButton(); // Re-bind UI button for birth year
    return year;
  },
});

/**
 * Saves the birthplace.
 */
export const saveBirthPlace = assign({
  birthPlace: ({ context, event }) => event.birthPlace,
});

/**
 * Adds a single commune to the list.
 */
export const addCommune = assign({
  communes: ({ context, event }) => {
    return [...context.communes, event.commune];
  },
});

/**
 * Adds a single département to the list.
 */
export const addDepartement = assign({
  departements: ({ context, event }) => {
    return [...context.departements, event.departement];
  },
});

/**
 * Adds multiple communes at once.
 * Also updates the current commune index to point to the first newly added commune.
 */
export const addMultipleCommunes = assign({
  communes: ({ context, event }) => {
    const newCommunes = [...context.communes, ...event.communes];
    return newCommunes;
  },
  currentCommuneIndex: ({ context }) => {
    const newIndex = context.communes.length;
    return newIndex;
  },
});

/**
 * Adds multiple housings for the current commune.
 */
export const addMultipleHousings = assign({
  logements: ({ context, event }) => {
    return event.logements || [];
  },
});

// ============================================================================= // NAVIGATION ACTIONS (indexes and groups) // =============================================================================

/** * Resets the housing index to 0. */
export const resetLogement = assign({
  currentLogementIndex: () => 0,
});

/**
 * Moves to the next housing.
 */
export const nextLogement = assign({
  currentLogementIndex: ({ context }) => context.currentLogementIndex + 1,
});

/**
 * Moves to the next commune.
 */
export const nextCommune = assign({
  currentCommuneIndex: ({ context, event }) => {
    const newIndex = context.currentCommuneIndex + 1;
    return newIndex;
  },
});

/**
 * Resets the commune index to 0.
 */
export const resetCommune = assign({
  currentCommuneIndex: ({ context, event }) => {
    return 0;
  },
});

/**
 * Moves to the next group (13 → 12 → 11).
 * NOTE: Only works for groups 14, 13, 12, 11.
 */
export const nextGroup = assign({
  group: ({ context, event }) => {
    return context.group - 1;
  },
});

/**
 * Moves back to the previous group (11 → 12 → 13).
 */
export const previousGroup = assign({
  group: ({ context, event }) => {
    return context.group + 1;
  },
});

// ============================================================================= // TIMELINE ACTIONS - Creating and modifying episodes // =============================================================================

/** * Parses a value (age or year) and returns a Date object. * - If < 200 → interpreted as an age * - If ≥ 200 → interpreted as a year */
function parseAgeOrYear(value, birthYear) {
  if (!value) return null;

  let strValue = value.toString().trim();
  let match = strValue.match(/\d+/);

  if (match) {
    let num = parseInt(match[0]);

    if (num < 200) {
      let year = birthYear + num;
      // Age → convert to year
      return new Date(`${year}-01-01`);
    } else {
      // Year
      return new Date(`${num}-01-01`);
    }
  }
  return null;
}

/**
 * Adds a new episode to the timeline.
 * Handles:
 *  - start/end date logic
 *  - group dependencies (e.g., housing depends on commune)
 *  - special tokens (timeline_init)
 *  - content resolution (commune, housing, status, etc.)
 *
 * IMPORTANT:
 * The user-provided start date (event.start) always has priority.
 */
export const addCalendarEpisode = assign({
  lastEpisode: ({ context, event }, params) => {
    let defaultStart = null;
    let defaultEnd = 0;
    let start = null;
    let end = 0;

    // 1. Parse start date from event (highest priority)
    if (event.start) {
      start = parseAgeOrYear(event.start, context.birthYear);
    }

    // 2. Handle timeline_init (used for birth commune)
    if (params?.start === "timeline_init") {
      if (!start) {
        start = window.timeline?.options?.start || new Date();
      }
      if (context.birthYear) {
        start = new Date(`${context.birthYear}-01-01`);
      } else {
        start = new Date();
      }
      defaultEnd = 0; // Will be computed by ajouterEpisode
    }

    // 3. Handle group dependencies (e.g., housing depends on commune)
    const currentGroup = groups.get(context.group);

    if (currentGroup && currentGroup.dependsOn) {
      // Housing depends on commune
      if (context.group === 12 && currentGroup.dependsOn === 13) {
        let filteritems = items
          .get()
          .filter((i) => i.group === currentGroup.dependsOn);
        let parentItem = filteritems[context.currentCommuneIndex];

        if (parentItem) {
          if (!start) defaultStart = parentItem.start;
          defaultEnd = parentItem.end;
        }
      }
      // If lastEpisode is from parent group
      else if (
        context.lastEpisode &&
        context.lastEpisode.group === currentGroup.dependsOn
      ) {
        if (!start) defaultStart = context.lastEpisode.start;
        defaultEnd = context.lastEpisode.end;
        // Otherwise use last item of parent group
      } else {
        let filteritems = items
          .get()
          .filter((i) => i.group === currentGroup.dependsOn);
        let parentItem =
          filteritems.length > 0 ? filteritems[filteritems.length - 1] : null;

        if (parentItem) {
          if (!start) defaultStart = parentItem.start;
          defaultEnd = parentItem.end;
        }
      }
    }

    // 4. Determine episode content
    let content;
    if (event.type === "ANSWER_BIRTH_COMMUNE") {
      content = event.commune[0];
    } else if (event.commune) {
      content = event.commune;
    } else if (event.statut_res) {
      content = event.statut_res;
    } else if (event.type === "YES" && context.group === 12) {
      content = "Logement unique";
    } else if (
      context.group === 12 &&
      context.logements &&
      context.logements.length > 0
    ) {
      content = context.logements[context.currentLogementIndex];
    } else {
      content = context.communes[context.currentCommuneIndex];
    }

    // Final start/end resolution
    let finalStart = start || defaultStart;
    let finalEnd = end || defaultEnd;
    start = finalStart;
    end = finalEnd;
    if (!finalStart) {
      console.warn(
        "addCalendarEpisode: pas de date de début, utilisation de la date actuelle"
      );
      finalStart = new Date();
    }

    return ajouterEpisode(content, start, end, context.group);
  },
});

/**
 * Modifies an existing episode on the timeline.
 * Handles:
 *  - special tokens (timeline_end, timeline_init)
 *  - age → year conversion
 */
export const modifyCalendarEpisode = assign({
  lastEpisode: ({ context, event }, params) => {
    if (!context.lastEpisode || !context.lastEpisode.id) {
      console.warn("lastEpisode est null dans modifyCalendarEpisode");
      return null;
    }

    // Handle special tokens
    if (params) {
      const normalized = Object.assign({}, params);
      try {
        if (normalized.end === "timeline_end") {
          normalized.end = window.timeline?.options?.end || new Date();
        }
        if (normalized.start === "timeline_init") {
          normalized.start = window.timeline?.options?.start || new Date();
        }
      } catch (e) {
        console.warn(
          "Erreur lors de la normalisation des params de modifyCalendarEpisode",
          e,
          params
        );
      }
      return modifierEpisode(context.lastEpisode.id, normalized);
    }

    // Parse event modifications
    const { type, ...modifs } = event;

    // Convert dates (age or year)
    if (modifs.end && typeof modifs.end === "string") {
      modifs.end = parseAgeOrYear(modifs.end, context.birthYear) || modifs.end;
    }
    if (modifs.start && typeof modifs.start === "string") {
      modifs.start =
        parseAgeOrYear(modifs.start, context.birthYear) || modifs.start;
    }

    if (!context.lastEpisode || !context.lastEpisode.id) {
      console.warn("lastEpisode est null, impossible de modifier l'épisode");
      return null;
    }

    return modifierEpisode(context.lastEpisode.id, modifs);
  },
});

/**
 * Closes the previous commune episode when entering a new commune.
 * Does NOT modify the birth commune (index 0).
 */
export const closePreviousCommuneEpisode = ({ context, event }) => {
  if (context.currentCommuneIndex <= 1) {
    return;
  }

  const allItems = items.get();
  const communeEpisodes = allItems.filter((i) => i.group === 13);

  if (communeEpisodes.length > 0 && event.start) {
    const lastCommuneEpisode = communeEpisodes[communeEpisodes.length - 1];
    const arrivalDate = new Date(`${event.start}-01-01`);
    modifierEpisode(lastCommuneEpisode.id, { end: arrivalDate });
  }
};

/**
 * Extends the previous episode by setting its end date equal to the new start.
 */
export const extendPreviousCalendarEpisode = ({ context, event }) => {
  const { type, ...modifs } = event;
  if (modifs.hasOwnProperty("start")) {
    modifs.end = modifs.start;
    delete modifs.start;
  }
  let previousEp = items.get()[context.currentCommuneIndex - 1];
  return modifierEpisode(previousEp.id, modifs);
};

/**
 * Splits a housing episode into two at a given year.
 */
export const splitHousingEpisode = assign({
  lastEpisode: ({ context, event }) => {
    const episodeToSplit = context.lastEpisode;
    const splitYear = parseInt(event.split);

    const startDate = new Date(episodeToSplit.start);
    const endDate = new Date(episodeToSplit.end);
    const splitDate = new Date(splitYear, 0, 1);

    // Modify the first housing episode
    modifierEpisode(episodeToSplit.id, { end: splitDate });

    // Add the second housing episode
    const secondEpisode = ajouterEpisode(
      episodeToSplit.content,
      splitDate,
      endDate,
      episodeToSplit.group
    );

    return secondEpisode;
  },
});

// ============================================================================= // CALENDAR SETUP ACTION // =============================================================================

/** * Configures the timeline based on the birth year. * Sets: * - timeline range * - initial position * - custom age labels * - birth-year markers */
export const setupCalendar = ({ context, event }) => {
  timeline.setOptions({
    min: new Date(`${event.birthdate - 4}-01-01`),
    start: new Date(`${event.birthdate - 4}-01-01`),
  });

  const birthDate = new Date(`${event.birthdate}-01-01`);
  timeline.moveTo(birthDate);

  timeline.setOptions({
    format: {
      minorLabels: function (date, scale, step) {
        switch (scale) {
          case "millisecond":
            return vis.moment(date).format("SSS");
          case "second":
            return vis.moment(date).format("s");
          case "minute":
            return vis.moment(date).format("HH:mm");
          case "hour":
            return vis.moment(date).format("HH:mm");
          case "weekday":
            return vis.moment(date).format("ddd D");
          case "day":
            return vis.moment(date).format("D");
          case "week":
            return vis.moment(date).format("w");
          case "month":
            return vis.moment(date).format("MMM");
          case "year":
            const age =
              new Date(date).getFullYear() -
              4 -
              new Date(
                window.timeline?.options?.start || new Date()
              ).getFullYear();
            if (
              new Date(date) < new Date(`${event.birthdate - 1}-01-01`) ||
              new Date(date) > new Date()
            ) {
            } else {
              return (
                "<b>" +
                new Date(date).getFullYear() +
                '</b></br><span class="year-age">' +
                age +
                ` ${age !== 0 && age !== 1 ? "ans" : "an"}</span>`
              );
            }
          default:
            return "";
        }
      },
    },
  });
  // Add birth-year markers
  timeline.addCustomTime(
    new Date(`${event.birthdate}-01-01`),
    "birth-year-bar"
  );
  timeline.setCustomTimeTitle(event.birthdate, "birth-year-bar");

  timeline.setCustomTime(new Date(`${event.birthdate}-01-01`), "custom-bar");
  timeline.setCustomTimeTitle(event.birthdate, "custom-bar");
};

// =============================================================================
// EXPORT ALL ACTIONS
// =============================================================================

export const actions = {
  saveBirthYear,
  saveBirthPlace,
  addCommune,
  addDepartement,
  addMultipleCommunes,
  addMultipleHousings,
  resetLogement,
  nextLogement,
  nextCommune,
  resetCommune,
  nextGroup,
  previousGroup,
  addCalendarEpisode,
  modifyCalendarEpisode,
  closePreviousCommuneEpisode,
  extendPreviousCalendarEpisode,
  splitHousingEpisode,
  setupCalendar,
};

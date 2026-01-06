/*
********************************************************************************
* guards.js - State machine transition conditions                              *
* Defines the logical conditions that determine whether certain transitions    *
* in the state machine are allowed to occur.                                   *
********************************************************************************
*/

/**
 * Checks whether there are still communes left to place on the timeline.
 * This guard is used during the initial placement phase, where each commune
 * must be positioned chronologically before processing housing details.
 *
 * @param {object} context - The XState context wrapper (contains .context with data)
 * @returns {boolean} - True if at least one commune has not yet been placed.
 */
export function hasMoreCommunesToPlace(context) {
  const result =
    context.context.currentCommuneIndex < context.context.communes.length;
  return result;
}

/**
 * Checks whether there are more communes to process after finishing the current one.
 * This guard is used when the machine completes the housing workflow for the
 * current commune and needs to determine whether to move to the next commune.
 *
 * @param {object} context - The XState context wrapper
 * @returns {boolean} - True if another commune exists after the current index.
 */
export function moreCommunesToProcess(context) {
  const result =
    context.context.currentCommuneIndex + 1 < context.context.communes.length;
  return result;
}

/**
 * Checks whether there are more housings (logements) to process within
 * the current commune. Each commune may contain multiple housing episodes,
 * and this guard determines whether the machine should continue iterating.
 *
 * @param {object} context - The XState context wrapper
 * @returns {boolean} - True if at least one more housing entry remains.
 */
export function moreLogementsToProcess(context) {
  const result =
    context.context.currentLogementIndex <
    context.context.logements.length - 1;
  return result;
}

/**
 * Exported collection of all guards used in the state machine configuration.
 * This allows the machine definition to reference guards by name.
 */
export const guards = {
  hasMoreCommunesToPlace,
  moreCommunesToProcess,
  moreLogementsToProcess,
};

/*
********************************************************************************
* guards.js - Conditions de transition de la machine à états                  *
* Détermine quand certaines transitions peuvent être effectuées               *
********************************************************************************
*/

/**
 * Vérifie s'il reste des communes à placer sur la timeline
 * Utilisé pour le placement initial des communes
 * @param {object} context - Le contexte XState (contient .context avec les données)
 * @returns {boolean}
 */
export function hasMoreCommunesToPlace(context) {
  const result = context.context.currentCommuneIndex < context.context.communes.length;
  return result;
}

/**
 * Vérifie s'il reste des communes à traiter pour les logements
 * On vient de terminer la commune à currentCommuneIndex
 * @param {object} context - Le contexte XState
 * @returns {boolean}
 */
export function moreCommunesToProcess(context) {
  const result = context.context.currentCommuneIndex + 1 < context.context.communes.length;
  return result;
}

/**
 * Vérifie s'il reste des logements à traiter dans la commune courante
 * @param {object} context - Le contexte XState
 * @returns {boolean}
 */
export function moreLogementsToProcess(context) {
  const result = context.context.currentLogementIndex < context.context.logements.length - 1;
  return result;
}

/**
 * Objet contenant tous les guards pour la configuration de la machine
 */
export const guards = {
  hasMoreCommunesToPlace,
  moreCommunesToProcess,
  moreLogementsToProcess
};

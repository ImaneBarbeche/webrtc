/*
********************************************************************************
* stateToQuestionMap.js - Map states to questions                              *
* Show readable questions instead of state identifiers                         *
********************************************************************************
*/

/**
 * Mapping between the machine's state identifiers and the questions displayed
 */
export const stateToQuestionMap = {
  'askBirthYear': 'Quelle est votre année de naissance ?',
  'birthPlaceIntro': 'Où habitaient vos parents à votre naissance ?',
  'askCurrentCommune': 'Dans quelle commune (ville) ?',
  'askDepartementOrPays': 'Dans quel département (France) ou pays (étranger) ?',
  'askAlwaysLivedInCommune': 'Avez-vous toujours vécu dans cette commune ?',
  'askBirthCommuneDepartureYear': 'En quelle année avez-vous quitté cette commune ?',
  'askMultipleCommunes': 'Pouvez-vous citer les communes dans lesquelles vous avez vécu ?',
  'askCommuneArrivalYear': 'En quelle année êtes-vous arrivé ?',
  'askCommuneDepartureYear': 'En quelle année avez-vous quitté cette commune ?',
  'askSameHousingInCommune': 'Avez-vous toujours vécu dans le même logement ?',
  'askMultipleHousings': 'Nous allons faire la liste des logements successifs',
  'askHousingArrivalAge': 'À quel âge ou en quelle année avez-vous emménagé ?',
  'askHousingDepartureAge': 'À quel âge ou en quelle année avez-vous quitté ce logement ?',
  'askHousingOccupationStatusEntry': 'Quel était votre statut d\'occupation à l\'arrivée ?',
  'askHousingOccupationStatusExit': 'Quel était votre statut d\'occupation au départ ?',
  'recapEpisode': 'Récapitulatif de l\'épisode',
  'surveyComplete': 'Merci, vous avez terminé l\'enquête !'
};

/**
 * Obtains the readable question from a state identifier
 * @param {string} state - state identifier
 * @returns {string} The corresponding question or the state itself if not found
 */
export function getQuestionFromState(state) {
  return stateToQuestionMap[state] || state;
}

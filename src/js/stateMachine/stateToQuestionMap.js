/*
********************************************************************************
* stateToQuestionMap.js - Mapping des états vers les questions                *
* Permet d'afficher les questions lisibles au lieu des identifiants d'états   *
********************************************************************************
*/

/**
 * Mapping entre les identifiants d'états de la machine et les questions affichées
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
 * Obtient la question lisible à partir d'un identifiant d'état
 * @param {string} state - L'identifiant de l'état
 * @returns {string} La question correspondante ou l'état lui-même si non trouvé
 */
export function getQuestionFromState(state) {
  return stateToQuestionMap[state] || state;
}

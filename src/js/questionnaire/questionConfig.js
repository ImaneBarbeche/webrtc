/**
 * Questionnaire question configuration
 * Returns the rendering parameters for each state of the state machine
 */

/**
 * Gets the configuration for a question based on the current state
 * @param {object} state - The current state of the state machine (with state.value and state.context)
 * @returns {object} - Question configuration { questionText, responseType, choices, eventType, eventKey }
 */
export function getQuestionConfig(state) {
  let questionText = "";
  let responseType = "input";
  let choices = [];
  let eventType = null;
  let eventKey = "commune";

  switch (state.value) {
    case "askBirthYear":
      questionText = "Quelle est votre année de naissance ?";
      responseType = "input";
      eventType = "ANSWER_BIRTH_YEAR";
      eventKey = "birthdate";
      break;

    case "birthPlaceIntro":
      questionText =
        "Où habitaient vos parents à votre naissance ? Dans quelle commune et département (France) ou pays (étranger) ?";
      responseType = "info";
      eventType = "NEXT";
      break;

    case "askCurrentCommune":
      questionText = "Dans quelle commune (ville) ?";
      responseType = "input";
      eventType = "ANSWER_CURRENT_COMMUNE";
      eventKey = "commune";
      break;

    case "askDepartementOrPays":
      questionText = "Dans quel département (France) ou pays (étranger) ?";
      responseType = "input";
      eventType = "ANSWER_DEPARTEMENT";
      eventKey = "departement";
      break;

    case "askAlwaysLivedInCommune": {
      const commune = state.context.communes?.[state.context.currentCommuneIndex] || "cette commune";
      questionText = `Avez-vous toujours vécu à ${commune} ?`;
      responseType = "choice";
      choices = ["Yes", "No"];
      eventKey = "alwaysLivedInCommune";
      break;
    }

    case "askBirthCommuneDepartureYear": {
      const commune = state.context.communes?.[0] || "cette commune";
      questionText = `En quelle année avez-vous quitté ${commune} ?`;
      responseType = "input";
      eventType = "ANSWER_BIRTH_COMMUNE_DEPARTURE";
      eventKey = "end";
      break;
    }

    case "askMultipleCommunes":
      questionText = "Pouvez-vous citer les communes dans lesquelles vous avez vécu ?";
      responseType = "inputlist";
      eventType = "ANSWER_MULTIPLE_COMMUNES";
      eventKey = "communes";
      break;

    case "askCommuneArrivalYear": {
      const commune = state.context.communes?.[state.context.currentCommuneIndex] || "cette commune";
      questionText = `En quelle année êtes-vous arrivé à ${commune} ?`;
      responseType = "input";
      eventType = "ANSWER_COMMUNE_ARRIVAL";
      eventKey = "start";
      break;
    }

    case "askCommuneDepartureYear": {
      const commune = state.context.communes?.[state.context.currentCommuneIndex] || "cette commune";
      questionText = `En quelle année avez-vous quitté ${commune} ?`;
      responseType = "input";
      eventType = "ANSWER_COMMUNE_DEPARTURE";
      eventKey = "end";
      break;
    }

    case "askSameHousingInCommune": {
      const commune = state.context.communes?.[state.context.currentCommuneIndex] || "cette commune";
      questionText = `Avez-vous toujours vécu dans le même logement à ${commune} ?`;
      responseType = "choice";
      choices = ["Yes", "No"];
      eventKey = "response";
      break;
    }

    case "askMultipleHousings": {
      const commune = state.context.communes?.[state.context.currentCommuneIndex] || "cette commune";
      questionText = `Nous allons faire la liste des logements successifs que vous avez occupés dans ${commune} depuis votre arrivée.`;
      responseType = "inputlist";
      eventType = "ANSWER_MULTIPLE_HOUSINGS";
      eventKey = "logements";
      break;
    }

    case "askHousingArrivalAge": {
      const logementNum = (state.context.currentLogementIndex || 0) + 1;
      const logementName = state.context.logements?.[state.context.currentLogementIndex];
      const logementLabel = logementName ? `le logement « ${logementName} »` : `le logement ${logementNum}`;
      questionText = `Donnez-nous les dates d'arrivée et de départ (ou l'âge) dans ${logementLabel}:`;
      responseType = "input";
      eventType = "ANSWER_HOUSING_ARRIVAL";
      eventKey = "start";
      break;
    }

    case "askHousingDepartureAge":
      const logementNameDep = state.context.logements?.[state.context.currentLogementIndex];
      const departLabel = logementNameDep ? `le logement « ${logementNameDep} »` : 'ce logement';
      questionText = `À quel âge ou en quelle année avez-vous quitté ${departLabel} ?`;
      responseType = "input";
      eventType = "ANSWER_HOUSING_DEPARTURE";
      eventKey = "end";
      break;

    case "askHousingOccupationStatusEntry":
      const logementNameEntry = state.context.logements?.[state.context.currentLogementIndex];
      const entryLabel = logementNameEntry ? `dans le logement « ${logementNameEntry} »` : 'dans ce logement';
      questionText = `Donnez-nous vos statuts d'occupation ${entryLabel} :`;
      responseType = "input";
      eventType = "ANSWER_STATUS_ENTRY";
      eventKey = "statut_res";
      break;

    case "askHousingOccupationStatusExit":
      const logementNameExit = state.context.logements?.[state.context.currentLogementIndex];
      const exitLabel = logementNameExit ? `du logement « ${logementNameExit} »` : 'du logement / actuellement';
      questionText = `Quel était votre statut d'occupation au départ ${exitLabel} ?`;
      responseType = "input";
      eventType = "ANSWER_STATUS_EXIT";
      eventKey = "statut_res";
      break;

    case "surveyComplete":
      questionText = "Merci, vous avez terminé l'enquête !";
      responseType = "none";
      break;

    default:
      questionText = `Question inconnue pour l'état: ${state.value}`;
      responseType = "none";
      break;
  }

  return {
    questionText,
    responseType,
    choices,
    eventType,
    eventKey
  };
}

/**
 * Updates the text of an existing question (for commune modifications)
 * @param {HTMLElement} questionP - The <p> element containing the text
 * @param {object} state - The current state
 */
export function updateQuestionText(questionP, state) {
  const commune = state.context.communes?.[state.context.currentCommuneIndex] || "cette commune";

  switch (state.value) {
    case "askAlwaysLivedInCommune":
      questionP.textContent = `Avez-vous toujours vécu à ${commune} ?`;
      break;
    case "askBirthCommuneDepartureYear": {
      const birthCommune = state.context.communes?.[0] || "cette commune";
      questionP.textContent = `En quelle année avez-vous quitté ${birthCommune} ?`;
      break;
    }
    case "askSameHousingInCommune":
      questionP.textContent = `Avez-vous toujours vécu dans le même logement à ${commune} ?`;
      break;
    case "askMultipleHousings":
      questionP.textContent = `Nous allons faire la liste des logements successifs que vous avez occupés dans ${commune} depuis votre arrivée.`;
      break;
    case "askCommuneArrivalYear":
      questionP.textContent = `En quelle année êtes-vous arrivé à ${commune} ?`;
      break;
    case "askCommuneDepartureYear":
      questionP.textContent = `En quelle année avez-vous quitté ${commune} ?`;
      break;
  }
}

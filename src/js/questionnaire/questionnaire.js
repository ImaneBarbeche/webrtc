import { items } from "../timeline/timeline.js";
import {
  surveyService,
  initializeSurveyService,
  setRenderCallback,
} from "../stateMachine/stateMachine.js";
import { renderYesNoQuestion } from "./choicesQuestions.js";
import { renderInputListQuestion } from "./inputListQuestion.js";
import { renderInputQuestion } from "./inputQuestion.js";
import { getQuestionConfig, updateQuestionText } from "./questionConfig.js";
import { sendEvent, getIsHost } from "./eventHandlers.js";
import { enableWebRTCSync, processPendingItems } from "./webrtcSync.js";
import { displayPreviousAnswers } from "./historyDisplay.js";
import { initResetHandler } from "./resetHandler.js";
/**
 ************************************************************************************************************
 * questionnaire.js gère l'affichage des questions et transition vers les états suivant                     *
 * Chaque question a un type d'evenement, correspondant à un état ou une transition dans la machine à états *
 ************************************************************************************************************
 */

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("questions");

  // Essayer d'activer WebRTC au chargement
  enableWebRTCSync();

  // Ré-essayer lors de l'affichage de LifeStories
  document.addEventListener("lifestoriesShown", () => {
    enableWebRTCSync();
  });

  // Initialisation de la machine à états avec restauration si nécessaire
  initializeSurveyService();

  // S'abonner aux changements d'état
  surveyService.subscribe((state) => {
    renderQuestion(state); // Mise à jour à chaque transition
  });

  // Définir le callback de rendu pour navigateToState
  setRenderCallback(renderQuestion);

  // Exposer container et items globalement pour renderYesNoQuestion
  window._questionnaireContainer = container;
  window._timelineItems = items;

  // IMPORTANT : Attendre le prochain tick pour que l'état soit restauré
  setTimeout(() => {
    const currentState = surveyService.getSnapshot();
    // Afficher les réponses précédentes AVANT la question actuelle
    displayPreviousAnswers(container);
    renderQuestion(currentState);
    // Si des items ont été stockés en attente (LOAD_ITEMS arrivés avant que la timeline
    // ait été initialisée), les ajouter maintenant et ajuster la timeline.
    processPendingItems();
  }, 0);

  function renderQuestion(state) {
    // Ignorer les états transitionnels (sans question à afficher)
    const transitionalStates = ['placeNextCommuneOnTimeline', 'checkMoreHousings'];
    if (transitionalStates.includes(state.value)) {
      return;
    }

    // Pour les questions qui dépendent de l'index (commune ou logement), créer un identifiant unique
    const statesThatDependOnIndex = [
      'askCommuneArrivalYear', 
      'askCommuneDepartureYear',
      'askSameHousingInCommune',
      'askHousingArrivalAge',
      'askHousingDepartureAge',
      'askHousingOccupationStatusEntry',
      'askHousingOccupationStatusExit'
    ];
    
    let questionId = state.value;
    if (statesThatDependOnIndex.includes(state.value)) {
      // Ajouter l'index de la commune/logement pour rendre l'ID unique
      questionId = `${state.value}_c${state.context.currentCommuneIndex}_l${state.context.currentLogementIndex}`;
    }

    // Vérifier si une question avec le même identifiant existe déjà
    const existingQuestion = container.querySelector(
      `[data-question-id="${questionId}"]`
    );

    // Si la question existe déjà, mettre à jour uniquement le texte (pour refléter les modifications de commune)
    if (existingQuestion) {
      const questionP = existingQuestion.querySelector("p");
      if (questionP && state.context.communes) {
        updateQuestionText(questionP, state);
      }
      return; // Ne pas créer de nouvelle question
    }

    // Obtenir la configuration de la question
    const { questionText, responseType, choices, eventType, eventKey } = getQuestionConfig(state);

    // Créer l'élément de question
    const questionDiv = document.createElement("div");
    questionDiv.classList.add("question");
    questionDiv.dataset.state = state.value;
    questionDiv.dataset.questionId = questionId;
    questionDiv.innerHTML += `<p>${questionText}</p>`;

    // État final (surveyComplete) : afficher le message de remerciement
    if (responseType === "none") {
      questionDiv.classList.add("survey-complete");
      container.appendChild(questionDiv);
      scrollToBottom(container);
      return;
    }

    // Gestion du type INFO (texte informatif + bouton suivant)
    if (responseType === "info") {
      const nextBtn = document.createElement("button");
      nextBtn.innerText = "Suivant";
      nextBtn.addEventListener("click", () => {
        sendEvent({ type: eventType });
      });
      questionDiv.appendChild(nextBtn);
    }

    // Gestion des réponses INPUT (ex: une commune, une année)
    else if (responseType === "input") {
      renderInputQuestion(questionDiv, state, eventType, eventKey, sendEvent, getIsHost());
    }

    // Gestion des boutons choix ("Oui", "Non")
    else if (responseType === "choice") {
      renderYesNoQuestion(questionDiv, state, eventKey, choices);
    }

    // Gestion des réponses avec un input et une liste
    else if (responseType === "inputlist") {
      renderInputListQuestion(
        questionDiv,
        state,
        eventType,
        eventKey,
        sendEvent,
        getIsHost()
      );
    }

    container.appendChild(questionDiv);
  }

  // Initialiser le gestionnaire du bouton reset
  initResetHandler();
});

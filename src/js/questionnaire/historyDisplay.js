/**
 * Affichage de l'historique des réponses du questionnaire
 */

import { loadAnsweredQuestions, getQuestionFromState } from "../stateMachine.js";

/**
 * Affiche les réponses précédentes dans le conteneur
 * @param {HTMLElement} container - Le conteneur où afficher l'historique
 */
export function displayPreviousAnswers(container) {
  const answeredQuestions = loadAnsweredQuestions();

  if (answeredQuestions.length === 0) return; // Rien à afficher

  // Créer un conteneur pour les réponses précédentes
  const previousAnswersDiv = document.createElement("div");
  previousAnswersDiv.className = "previous-answers-section";
  previousAnswersDiv.innerHTML = "<h3>Historique des réponses</h3>";

  answeredQuestions.forEach((item, index) => {
    const answerDiv = document.createElement("div");
    answerDiv.className = "previous-answer";

    // Obtenir la question à partir de l'état
    const question = getQuestionFromState(item.state);

    // Formater la réponse selon le type
    const answerText = formatAnswer(item.answer);

    answerDiv.innerHTML = `
      <p class="question-text"><strong>Q${index + 1}:</strong> ${question}</p>
      <p class="answer-content"><strong>${answerText}</strong></p>
      <small>${new Date(item.timestamp).toLocaleTimeString("fr-FR")}</small>
    `;

    previousAnswersDiv.appendChild(answerDiv);
  });

  // Ajouter un séparateur
  const separator = document.createElement("hr");
  separator.className = "questions-separator";

  // Insérer au début du conteneur
  container.insertBefore(separator, container.firstChild);
  container.insertBefore(previousAnswersDiv, container.firstChild);
}

/**
 * Formate une réponse pour l'affichage
 * @param {any} answer - La réponse à formater
 * @returns {string} - La réponse formatée
 */
function formatAnswer(answer) {
  let answerText = JSON.stringify(answer.value || answer, null, 2);
  
  if (typeof answer === "object") {
    // Extraire la valeur réelle de la réponse
    const key = Object.keys(answer).find((k) => k !== "type");
    answerText = answer[key] || JSON.stringify(answer);
  }

  // Formater comme un tableau
  if (Array.isArray(answerText)) {
    answerText = answerText.join(", ");
  }

  return answerText;
}

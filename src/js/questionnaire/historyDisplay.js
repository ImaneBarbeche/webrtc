/**
 * Affichage de l'historique des réponses du questionnaire
 */

import { loadAnsweredQuestions, getQuestionFromState } from "../stateMachine/stateMachine.js";

/**
 * Affiche les réponses précédentes dans le conteneur
 * @param {HTMLElement} container - Le conteneur où afficher l'historique
 */
export function displayPreviousAnswers(container) {
  // Vider le conteneur avant d'ajouter l'historique
  container.innerHTML = "";

  const answeredQuestions = loadAnsweredQuestions();
  if (answeredQuestions.length === 0) return; // Rien à afficher

  // Créer un conteneur pour les réponses précédentes
  const previousAnswersDiv = document.createElement("div");
  previousAnswersDiv.className = "previous-answers-section";
  previousAnswersDiv.innerHTML = "<h3>Historique des réponses</h3>";

  let displayIndex = 1;
  answeredQuestions.forEach((item) => {
    // Ne rien afficher si la réponse est vide, nulle ou indéfinie
    let value = (item.answer && typeof item.answer === "object" && "value" in item.answer)
      ? item.answer.value
      : item.answer;
    if (value === undefined || value === null || value === "") return;

    const answerDiv = document.createElement("div");
    answerDiv.className = "previous-answer";

    // Obtenir la question à partir de l'état
    const question = getQuestionFromState(item.state);

    // Formater la réponse selon le type
    const answerText = formatAnswer(item.answer);

    answerDiv.innerHTML = `
      <p class="question-text"><strong>Q${displayIndex}:</strong> ${question}</p>
      <p class="answer-content"><strong>${answerText}</strong></p>
      <small>${new Date(item.timestamp).toLocaleTimeString("fr-FR")}</small>
    `;

    previousAnswersDiv.appendChild(answerDiv);
    displayIndex++;
  });

  // Ajouter un séparateur
  const separator = document.createElement("hr");
  separator.className = "questions-separator";

  // Insérer au début du conteneur
  container.appendChild(separator);
  container.appendChild(previousAnswersDiv);
}

function formatAnswer(answer) {
  if (answer && typeof answer === "object" && "value" in answer) {
    // Afficher la vraie valeur éditée
    if (Array.isArray(answer.value)) {
      return answer.value.join(", ");
    }
    return String(answer.value);
  }
  let answerText = JSON.stringify(answer.value || answer, null, 2);
  if (typeof answer === "object") {
    const key = Object.keys(answer).find((k) => k !== "type");
    answerText = answer[key] || JSON.stringify(answer);
  }
  if (Array.isArray(answerText)) {
    answerText = answerText.join(", ");
  }
  return answerText;
}

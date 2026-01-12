/**
 * Displaying the history of questionnaire answers.
 */

import { loadAnsweredQuestions, getQuestionFromState } from "../stateMachine/stateMachine.js";

/**
 * Renders the list of previously answered questions inside a container.
 * @param {HTMLElement} container - The DOM element where the history should be displayed.
 */
export function displayPreviousAnswers(container) {
  // Clear the container before inserting the history
  container.innerHTML = "";

  // Retrieve all stored answered questions from the state machine
  const answeredQuestions = loadAnsweredQuestions();
  if (answeredQuestions.length === 0) return; // Nothing to display

  // Create a wrapper for the history section
  const previousAnswersDiv = document.createElement("div");
  previousAnswersDiv.className = "previous-answers-section";
  previousAnswersDiv.innerHTML = "<h3>Historique des réponses</h3>";

  let displayIndex = 1;

  answeredQuestions.forEach((item) => {
    /**
     * Skip answers that are empty, null, or undefined.
     * Some answers are stored as objects with a `.value` field (edited answers),
     * others are stored directly as primitives.
     */
    let value =
      item.answer &&
      typeof item.answer === "object" &&
      "value" in item.answer
        ? item.answer.value
        : item.answer;

    if (value === undefined || value === null || value === "") return;

    // Create a block for this specific answer
    const answerDiv = document.createElement("div");
    answerDiv.className = "previous-answer";

    // Retrieve the human-readable question text based on the state name
    const question = getQuestionFromState(item.state);

    // Format the answer depending on its structure
    const answerText = formatAnswer(item.answer);

    // Build the HTML for this answer entry
    answerDiv.innerHTML = `
      <p class="question-text"><strong>Q${displayIndex}:</strong> ${question}</p>
      <p class="answer-content"><strong>${answerText}</strong></p>
      <small>${new Date(item.timestamp).toLocaleTimeString("fr-FR")}</small>
    `;

    previousAnswersDiv.appendChild(answerDiv);
    displayIndex++;
  });

  // Add a visual separator before the history section
  const separator = document.createElement("hr");
  separator.className = "questions-separator";

  // Insert the separator and the history section into the container
  container.appendChild(separator);
  container.appendChild(previousAnswersDiv);
}

/**
 * Formats an answer object into a readable string.
 * Handles multiple answer shapes:
 *  - { value: ... } for edited answers
 *  - primitive values
 *  - objects with a single meaningful key
 *
 * @param {any} answer - The stored answer (may be primitive or object).
 * @returns {string} - A human-readable formatted answer.
 */
function formatAnswer(answer) {
  // Case 1: Edited answers stored as { value: ... }
  if (answer && typeof answer === "object" && "value" in answer) {
    if (Array.isArray(answer.value)) {
      // Join arrays into a comma-separated list
      return answer.value.join(", ");
    }
    return String(answer.value);
  }

  // Case 2: Primitive or generic object
  let answerText = JSON.stringify(answer.value || answer, null, 2);

  // If it's an object, extract the meaningful key (excluding "type")
  if (typeof answer === "object") {
    const key = Object.keys(answer).find((k) => k !== "type");
    answerText = answer[key] || JSON.stringify(answer);
  }

  // If the result is an array, join it
  if (Array.isArray(answerText)) {
    answerText = answerText.join(", ");
  }

  return answerText;
}

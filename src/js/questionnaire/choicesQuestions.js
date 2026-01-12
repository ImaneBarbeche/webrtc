// Function responsible for rendering a Yes/No question and handling edits
import { surveyService, navigateToState } from "../stateMachine/stateMachine.js";
import { sendEvent } from "./eventHandlers.js";

export function renderYesNoQuestion(questionDiv, state, eventKey, choices = ["Yes", "No"]) {
  // Capture the state name at the moment this question is rendered
  const questionState = state.value;

  const choicesButtons = [];
  const answerSpan = document.createElement("span");

  // Edit button (hidden until the user answers)
  const editBtn = document.createElement("button");
  editBtn.innerHTML = '<i data-lucide="pencil"></i>';
  editBtn.className = "edit-btn";
  editBtn.style.display = "none";

  // Create one button per choice (Yes / No by default)
  choices.forEach((choice) => {
    const button = document.createElement("button");
    button.innerText = choice;

    button.addEventListener("click", () => {
      // Send the event through WebRTC to sync with other clients
      sendEvent({ type: choice.toUpperCase() });

      // Display the selected answer
      answerSpan.textContent = `Réponse actuelle : ${choice}`;

      // Disable buttons to prevent changing the answer immediately
      choicesButtons.forEach((btn) => (btn.disabled = true));

      // Reveal the edit button
      editBtn.style.display = "inline-block";
    });

    questionDiv.appendChild(button);
    choicesButtons.push(button);
  });

  // --- Edit button logic ---
  editBtn.addEventListener("click", () => {
    // Re-enable the Yes/No buttons so the user can pick a new answer
    choicesButtons.forEach((btn) => (btn.disabled = false));

    // Override the click handler to support editing
    choicesButtons.forEach((btn) => {
      btn.onclick = () => {
        const choice = btn.innerText;

        // Get the current state of the state machine
        const currentState = surveyService.getSnapshot().value;

        // If the user is still on the same question, simply send a new event
        if (currentState === questionState) {
          sendEvent({ type: choice.toUpperCase() });
          answerSpan.textContent = `Réponse actuelle : ${choice}`;
          choicesButtons.forEach((b) => (b.disabled = true));
          return;
        }

        // If the user has progressed beyond this question,
        // we need to "rewind" the questionnaire UI and timeline
        const container = window._questionnaireContainer;
        const items = window._timelineItems;

        // --- 1. Remove all DOM questions that appear after this one ---
        if (container) {
          const allQuestions = container.querySelectorAll('.question[data-state]');
          let foundCurrentQuestion = false;

          allQuestions.forEach((q) => {
            if (q.dataset.state === questionState) {
              foundCurrentQuestion = true;
              q.remove(); // Remove this question too; it will be re-rendered
            } else if (foundCurrentQuestion) {
              q.remove(); // Remove all following questions
            }
          });
        }

        // --- 2. Clean up timeline items depending on the question being edited ---
        if (items) {
          if (questionState === "askAlwaysLivedInCommune") {
            // Remove groups 11 and 12 (housing history)
            const allItems = items.get();
            const itemsToRemove = allItems.filter(item => item.group === 12 || item.group === 11);
            itemsToRemove.forEach(item => items.remove(item.id));
          } else if (questionState === "askSameHousingInCommune") {
            // Remove only group 11
            const allItems = items.get();
            const itemsToRemove = allItems.filter(item => item.group === 11);
            itemsToRemove.forEach(item => items.remove(item.id));
          }
        }

        // --- 3. Prepare context updates depending on the question being edited ---
        let contextUpdates = {};

        if (questionState === "askAlwaysLivedInCommune") {
          contextUpdates = {
            group: 13,
            logements: [],
            currentLogementIndex: 0
          };
        } else if (questionState === "askSameHousingInCommune") {
          contextUpdates = {
            group: 12,
            logements: [],
            currentLogementIndex: 0
          };
        }

        // --- 4. Navigate back to the target state (recreates the state machine) ---
        navigateToState(questionState, contextUpdates);

        // --- 5. After a short delay, send the new answer through WebRTC ---
        setTimeout(() => {
          sendEvent({ type: choice.toUpperCase() });
        }, 100);
      };
    });
  });

  // Add the answer display and edit button to the question container
  questionDiv.appendChild(answerSpan);
  questionDiv.appendChild(editBtn);

  // Initialize Lucide icons if available
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

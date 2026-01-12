import { items } from "../timeline/timeline.js";
import {
  surveyService,
  initializeSurveyService,
  setRenderCallback,
} from "../stateMachine/stateMachine.js";
import { renderYesNoQuestion } from "./choicesQuestions.js";
import { renderInputListQuestion } from "./inputListQuestion.js";
import { renderInputQuestion } from "./inputQuestion.js";
import { renderPairedYearAgeInputs } from "./renderPairedYearAgeInputs.js";
import { renderPairedStatusDropdowns } from "./renderPairedStatusDropdowns.js";
import { getQuestionConfig, updateQuestionText } from "./questionConfig.js";
import { sendEvent, getIsHost } from "./eventHandlers.js";
import { enableWebRTCSync, processPendingItems } from "./webrtcSync.js";
import { displayPreviousAnswers } from "./historyDisplay.js";
import { initResetHandler } from "./resetHandler.js";
import { getGapCount, getGapList } from "../timeline/gapDetection.js";
import { getOverlaps } from "../timeline/overlapDetection.js";
import { groupsData } from "../timeline/timelineData.js";
/**
 ************************************************************************************************************
 * questionnaire.js manages the display of questions and transitions to the next states                     *
 * Each question has an event type, corresponding to a state or transition in the state machine             *
 ************************************************************************************************************
 */
function getGroupName(groupId) {
  // Find the group by its id
  const groupInfo = groupsData.find((g) => g.id === Number(groupId));
  return groupInfo ? groupInfo.contentText : groupId;
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("questions");
  const actionsContainer = document.getElementById("questionnaire-actions");

  const gapBtn = document.createElement("button");
  gapBtn.id = "gap-counter-btn";
  const initialGapCount = getGapCount();
  const initialOverlapCount =
    typeof getOverlaps === "function" ? getOverlaps().length : 0;
  gapBtn.setAttribute(
    "aria-label",
    `Périodes manquantes : ${initialGapCount} — Chevauchements : ${initialOverlapCount}`
  );
  gapBtn.title = `Périodes manquantes : ${initialGapCount} — Chevauchements : ${initialOverlapCount}`;
  gapBtn.innerHTML = `
    <i data-lucide="triangle-alert" class="lucide gap-icon" aria-hidden="true"></i>
    <span class="gap-badge">${initialGapCount}</span>
    <span class="overlap-badge">${initialOverlapCount}</span>
  `;
  // Place the gap button next to export/load when possible for consistent layout
  if (actionsContainer) {
    actionsContainer.appendChild(gapBtn);
  } else {
    container.appendChild(gapBtn);
  }
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  gapBtn.addEventListener("click", () => {
    const gaps = getGapList();
    const overlaps = typeof getOverlaps === "function" ? getOverlaps() : [];

    const overlay = document.createElement("div");
    overlay.className = "gap-modal-overlay";

    const modal = document.createElement("div");
    modal.className = "gap-modal-content";

    const closeBtn = document.createElement("button");
    closeBtn.className = "gap-modal-close";
    closeBtn.innerText = "Fermer";
    closeBtn.addEventListener("click", () => overlay.remove());

    const gapHtml =
      gaps.length === 0
        ? `<div class="gap-modal-empty">Aucune période manquante détectée.</div>`
        : `<ul class="gap-list">
          ${gaps
            .map(
              (gap) => `
            <li>
              <strong>${getGroupName(gap.group)}</strong> : 
              ${new Date(gap.start).getFullYear()} → ${new Date(
                gap.end
              ).getFullYear()}
            </li>
          `
            )
            .join("")}
        </ul>`;

    const overlapHtml =
      overlaps.length === 0
        ? `<div class="gap-modal-empty">Aucun chevauchement détecté.</div>`
        : `<ul class="overlap-list">
          ${overlaps
            .map(
              (ov) => `
              <li>
                <strong>${getGroupName(
                  ov._originalGroup
                )}</strong> : ${new Date(ov.start).getFullYear()} → ${new Date(
                ov.end
              ).getFullYear()}
              </li>
            `
            )
            .join("")}
        </ul>`;

    // Build structured modal with two sections for responsiveness
    modal.innerHTML = `<h3>Vérifications</h3>`;
    const sections = document.createElement("div");
    sections.className = "gap-modal-sections";

    const gapsSection = document.createElement("div");
    gapsSection.className = "gap-modal-section";
    gapsSection.innerHTML = `
      <div class="section-title">
        <i data-lucide="triangle-alert" class="lucide gap-icon" aria-hidden="true"></i>
        <span>Périodes manquantes (${gaps.length})</span>
      </div>
      ${gapHtml}
    `;

    const overlapsSection = document.createElement("div");
    overlapsSection.className = "gap-modal-section";
    overlapsSection.innerHTML = `
      <div class="section-title">
        <i data-lucide="slash" class="lucide overlap-icon" aria-hidden="true" style="color:#d32f2f"></i>
        <span>Chevauchements (${overlaps.length})</span>
      </div>
      ${overlapHtml}
    `;

    sections.appendChild(gapsSection);
    sections.appendChild(overlapsSection);

    modal.appendChild(sections);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    if (window.lucide && typeof window.lucide.createIcons === "function")
      window.lucide.createIcons();
  });

  const updateGapCounter = () => {
    const n = getGapCount();
    const m = typeof getOverlaps === "function" ? getOverlaps().length : 0;
    const gapBadge = gapBtn.querySelector(".gap-badge");
    const overlapBadge = gapBtn.querySelector(".overlap-badge");
    if (gapBadge) {
      gapBadge.textContent = String(n);
      if (n > 0 && gapBadge.animate) {
        try {
          gapBadge.animate(
            [{ transform: "scale(1.15)" }, { transform: "scale(1)" }],
            { duration: 220, easing: "ease-out" }
          );
        } catch (e) {
          // animation not supported — ignore
        }
      }
    }
    if (overlapBadge) {
      overlapBadge.textContent = String(m);
      if (m > 0 && overlapBadge.animate) {
        try {
          overlapBadge.animate(
            [{ transform: "scale(1.15)" }, { transform: "scale(1)" }],
            { duration: 220, easing: "ease-out" }
          );
        } catch (e) {}
      }
    }
    const label = `Périodes manquantes : ${n} — Chevauchements : ${m}`;
    gapBtn.setAttribute("aria-label", label);
    gapBtn.title = label;
    gapBtn.classList.toggle("has-gaps", n > 0);
    gapBtn.classList.toggle("has-overlaps", m > 0);
  };
  items.on("add", updateGapCounter);
  items.on("update", updateGapCounter);
  items.on("remove", updateGapCounter);

  // Try to enable WebRTC on load
  enableWebRTCSync();

  // Retry when LifeStories is displayed
  document.addEventListener("lifestoriesShown", () => {
    enableWebRTCSync();
  });

  // Initialize the state machine with restoration if needed
  initializeSurveyService();

  // Subscribe to state changes
  surveyService.subscribe((state) => {
    renderQuestion(state); // Update on each transition
  });

  // Set the render callback for navigateToState
  setRenderCallback(renderQuestion);

  // Expose container and items globally for renderYesNoQuestion
  window._questionnaireContainer = container;
  window._timelineItems = items;

  // IMPORTANT: Wait for the next tick so that the state is restored
  setTimeout(() => {
    const currentState = surveyService.getSnapshot();
    // Display previous answers BEFORE the current question
    displayPreviousAnswers(container);
    renderQuestion(currentState);
    // If items were stored pending (LOAD_ITEMS arrived before the timeline was initialized), add them now and adjust the timeline.
    processPendingItems();
  }, 0);

  function renderQuestion(state) {
    // Ignore transitional states (no question to display)
    const transitionalStates = [
      "placeNextCommuneOnTimeline",
      "checkMoreHousings",
    ];
    if (transitionalStates.includes(state.value)) {
      return;
    }

    // For questions that depend on the index (commune or housing), create a unique identifier
    const statesThatDependOnIndex = [
      "askCommuneArrivalYear",
      "askCommuneDepartureYear",
      "askSameHousingInCommune",
      "askHousingArrivalAge",
      "askHousingDepartureAge",
      "askHousingOccupationStatusEntry",
      "askHousingOccupationStatusExit",
    ];

    let questionId = state.value;
    if (statesThatDependOnIndex.includes(state.value)) {
      // Add the commune/housing index to make the ID unique
      questionId = `${state.value}_c${state.context.currentCommuneIndex}_l${state.context.currentLogementIndex}`;
    }

    // Check if a question with the same identifier already exists
    const existingQuestion = container.querySelector(
      `[data-question-id="${questionId}"]`
    );

    // If the question already exists, only update the text (to reflect commune modifications)
    if (existingQuestion) {
      const questionP = existingQuestion.querySelector("p");
      if (questionP && state.context.communes) {
        updateQuestionText(questionP, state);
      }
      return; // Do not create a new question
    }

    // Avoid double rendering when a paired block has already been inserted
    if (
      state.value === "askHousingArrivalAge" ||
      state.value === "askHousingDepartureAge"
    ) {
      const pairId = `pair_housing_c${
        state.context.currentCommuneIndex || 0
      }_l${state.context.currentLogementIndex || 0}`;
      const existingPair = container.querySelector(
        `[data-pair-id="${pairId}"]`
      );
      if (existingPair) return;
    }
    if (
      state.value === "askHousingOccupationStatusEntry" ||
      state.value === "askHousingOccupationStatusExit"
    ) {
      const pairId = `pair_status_c${state.context.currentCommuneIndex || 0}_l${
        state.context.currentLogementIndex || 0
      }`;
      const existingPair = container.querySelector(
        `[data-pair-id="${pairId}"]`
      );
      if (existingPair) return;
    }

    // Get the question configuration
    const { questionText, responseType, choices, eventType, eventKey } =
      getQuestionConfig(state);

    // Create the question element
    const questionDiv = document.createElement("div");
    questionDiv.classList.add("question");
    questionDiv.dataset.state = state.value;
    questionDiv.dataset.questionId = questionId;
    questionDiv.innerHTML += `<p>${questionText}</p>`;

    // Final state (surveyComplete): display the thank you message
    if (responseType === "none") {
      questionDiv.classList.add("survey-complete");
      container.appendChild(questionDiv);
      // scrollToBottom(container);
      return;
    }

    // Handle INFO type (informative text + next button)
    if (responseType === "info") {
      const nextBtn = document.createElement("button");
      nextBtn.innerText = "Suivant";
      nextBtn.className = "primary-button";
      nextBtn.addEventListener("click", () => {
        sendEvent({ type: eventType });
      });
      questionDiv.appendChild(nextBtn);
    }

    // Handle INPUT responses (e.g., a commune, a year)
    else if (responseType === "input") {
      // Year+age pairs for housing
      if (state.value === "askHousingArrivalAge") {
        const pairId = `pair_housing_c${
          state.context.currentCommuneIndex || 0
        }_l${state.context.currentLogementIndex || 0}`;
        const existing = container.querySelector(`[data-pair-id="${pairId}"]`);
        if (existing) return;

        renderPairedYearAgeInputs(
          questionDiv,
          state,
          {
            yearLabel: "Année d'arrivée",
            yearEventType: "ANSWER_HOUSING_ARRIVAL",
            yearEventKey: "start",
            ageLabel: "Âge à l'arrivée",
            ageEventType: "ANSWER_HOUSING_ARRIVAL_AGE",
            ageEventKey: "arrival_age",
          },
          {
            yearLabel: "Année de départ",
            yearEventType: "ANSWER_HOUSING_DEPARTURE",
            yearEventKey: "end",
            ageLabel: "Âge au départ",
            ageEventType: "ANSWER_HOUSING_DEPARTURE_AGE",
            ageEventKey: "departure_age",
          },
          sendEvent,
          getIsHost()
        );
      } else if (state.value === "askHousingOccupationStatusEntry") {
        const pairId = `pair_status_c${
          state.context.currentCommuneIndex || 0
        }_l${state.context.currentLogementIndex || 0}`;
        const existing = container.querySelector(`[data-pair-id="${pairId}"]`);
        if (existing) return;
        renderPairedStatusDropdowns(
          questionDiv,
          state,
          {
            label: "Statut à l'arrivée",
            eventType: "ANSWER_STATUS_ENTRY",
            eventKey: "statut_res",
          },
          {
            label: "Statut au départ",
            eventType: "ANSWER_STATUS_EXIT",
            eventKey: "statut_res",
          },
          sendEvent,
          getIsHost()
        );
      } else {
        renderInputQuestion(
          questionDiv,
          state,
          eventType,
          eventKey,
          sendEvent,
          getIsHost()
        );
      }
    }

    // Handle choice buttons ("Yes", "No")
    else if (responseType === "choice") {
      renderYesNoQuestion(questionDiv, state, eventKey, choices);
    }

    // Handle responses with an input and a list
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

    const autoInput = questionDiv.querySelector("input, textarea, select");
    if (autoInput) {
      autoInput.focus();
    }
  }

  // Initialize the reset button handler
  initResetHandler();
});

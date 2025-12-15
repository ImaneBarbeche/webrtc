import { items } from "../timeline/timeline.js";
import {
  surveyService,
  initializeSurveyService,
  setRenderCallback,
} from "../stateMachine/stateMachine.js";
import { renderYesNoQuestion } from "./choicesQuestions.js";
import { renderInputListQuestion } from "./inputListQuestion.js";
import { renderInputQuestion } from "./inputQuestion.js";
import { renderPairedDateInputs } from "./inputQuestion.js";
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
 * questionnaire.js gère l'affichage des questions et transition vers les états suivant                     *
 * Chaque question a un type d'evenement, correspondant à un état ou une transition dans la machine à états *
 ************************************************************************************************************
 */
function getGroupName(groupId) {
  // Cherche le groupe par son id
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
    const transitionalStates = [
      "placeNextCommuneOnTimeline",
      "checkMoreHousings",
    ];
    if (transitionalStates.includes(state.value)) {
      return;
    }

    // Pour les questions qui dépendent de l'index (commune ou logement), créer un identifiant unique
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

    // Si on est dans l'état de départ mais un bloc pair a déjà été rendu, éviter la duplication
    if (state.value === "askCommuneDepartureYear") {
      const pairId = `pair_commune_c${state.context.currentCommuneIndex || 0}`;
      const existing = container.querySelector(`[data-pair-id="${pairId}"]`);
      if (existing) return;
    }
    if (state.value === "askHousingDepartureAge") {
      const pairId = `pair_housing_c${
        state.context.currentCommuneIndex || 0
      }_l${state.context.currentLogementIndex || 0}`;
      const existing = container.querySelector(`[data-pair-id="${pairId}"]`);
      if (existing) return;
    }
    // Vérifier pour les paires de statuts résidentiels
    if (state.value === "askHousingOccupationStatusExit") {
      const pairId = `pair_status_c${state.context.currentCommuneIndex || 0}_l${
        state.context.currentLogementIndex || 0
      }`;
      const existing = container.querySelector(`[data-pair-id="${pairId}"]`);
      if (existing) return;
    }
    // Obtenir la configuration de la question
    const { questionText, responseType, choices, eventType, eventKey } =
      getQuestionConfig(state);

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
      // Pour les paires arrivée/départ, afficher côte à côte
      if (state.value === "askCommuneArrivalYear") {
        // Si un bloc pair existe déjà pour cette commune, ne rien faire
        const pairId = `pair_commune_c${
          state.context.currentCommuneIndex || 0
        }`;
        const existing = container.querySelector(`[data-pair-id="${pairId}"]`);
        if (existing) return;

        renderPairedDateInputs(
          questionDiv,
          state,
          {
            label: "Arrivée",
            eventType: "ANSWER_COMMUNE_ARRIVAL",
            eventKey: "start",
          },
          {
            label: "Départ",
            eventType: "ANSWER_COMMUNE_DEPARTURE",
            eventKey: "end",
          },
          sendEvent,
          getIsHost()
        );
      } else if (state.value === "askHousingArrivalAge") {
        const pairId = `pair_housing_c${
          state.context.currentCommuneIndex || 0
        }_l${state.context.currentLogementIndex || 0}`;
        const existing = container.querySelector(`[data-pair-id="${pairId}"]`);
        if (existing) return;

        renderPairedDateInputs(
          questionDiv,
          state,
          {
            label: "Arrivée",
            eventType: "ANSWER_HOUSING_ARRIVAL",
            eventKey: "start",
          },
          {
            label: "Départ",
            eventType: "ANSWER_HOUSING_DEPARTURE",
            eventKey: "end",
          },
          sendEvent,
          getIsHost()
        );
      } // NOUVEAU: PAIRES DE STATUTS RÉSIDENTIELS
      else if (state.value === "askHousingOccupationStatusEntry") {
        const pairId = `pair_status_c${state.context.currentCommuneIndex || 0}_l${state.context.currentLogementIndex || 0}`;
        const existing = container.querySelector(`[data-pair-id="${pairId}"]`);
        if (existing) return;
        import("./renderPairedStatusDropdowns.js").then((module) => {
          const { renderPairedStatusDropdowns } = module;
          renderPairedStatusDropdowns(
            questionDiv,
            state,
            {
              label: "Statut à l'arrivée",
              eventType: "ANSWER_STATUS_ENTRY",
              eventKey: "statut_res"
            },
            {
              label: "Statut au départ",
              eventType: "ANSWER_STATUS_EXIT",
              eventKey: "statut_res"
            },
            sendEvent,
            getIsHost()
          );
        });
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

// Fonction pour créer les questions avec un input simple (ex: commune, année, statut)

import { surveyService } from "../stateMachine/stateMachine.js";
import { setBirthYear } from "../timeline/birthYear.js";

/**
 * Crée un champ input simple avec gestion de l'édition
 * @param {HTMLElement} questionDiv - Le conteneur de la question
 * @param {object} state - L'état actuel de la machine
 * @param {string} eventType - Le type d'événement à envoyer (ex: "ANSWER_BIRTH_YEAR")
 * @param {string} eventKey - La clé pour les données (ex: "birthdate", "commune", "start")
 * @param {function} sendEvent - Fonction pour envoyer l'événement à la machine
 * @param {boolean} isHost - Si l'utilisateur est l'hôte (pour désactiver les contrôles)
 */
export function renderInputQuestion(questionDiv, state, eventType, eventKey, sendEvent, isHost = true) {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Votre réponse";

  // Si une valeur existe déjà dans le contexte, la pré-remplir et désactiver
  if (state.context[eventKey]) {
    input.value = state.context[eventKey];
    input.disabled = true;
  }

  const editBtn = document.createElement("button");
  editBtn.innerHTML = '<i data-lucide="pencil"></i>';
  editBtn.className = "edit-btn";
  editBtn.style.display = "none"; // caché tant que pas de réponse

  // Gestion du bouton d'édition
  editBtn.addEventListener("click", () => {
    input.disabled = false;
    input.focus();
    
    // Listener pour valider la modification avec Entrée
    input.addEventListener("keypress", (event) => {
      if (event.key === "Enter" && input.value.trim() !== "") {
        handleEditUpdate(input, eventKey);
        input.disabled = true;
      }
    });
  });

  // Listener pour la première réponse
  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && input.value.trim() !== "" && eventType) {
      // Créer et envoyer l'événement
      const eventData = { type: eventType };
      eventData[eventKey] = input.value;
      
      // Cas spécial pour l'année de naissance
      if (eventType === "ANSWER_BIRTH_YEAR") {
        setBirthYear(input.value);
      }
      
      sendEvent(eventData);
      input.disabled = true;
      editBtn.style.display = "inline-block"; // afficher le bouton après validation

      // Désactiver les contrôles pour éviter le double envoi
      if (isHost) {
        disableQuestionControls(questionDiv, editBtn);
      }
    }
  });

  questionDiv.appendChild(input);
  questionDiv.appendChild(editBtn);

  // Transformer les icônes Lucide
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

/**
 * Gère la mise à jour d'une réponse existante
 * @param {HTMLInputElement} input - Le champ input
 * @param {string} eventKey - La clé pour les données
 */
function handleEditUpdate(input, eventKey) {
  const updateEvent = {
    type: "UPDATE_ANSWER",
    key: eventKey,
    value: input.value,
    updateEpisode: ["start", "end", "statut_res"].includes(eventKey),
  };
  surveyService.send(updateEvent);

  // Cas spécial pour l'année de naissance - mettre à jour la timeline
  if (eventKey === "birthdate" || eventKey === "birthYear") {
    if (window.timeline) {
      window.timeline.setOptions({
        min: new Date(`${input.value}-01-01`),
        start: new Date(`${input.value}-01-01`),
      });
      window.timeline.redraw();
      window.timeline.fit();
    }
  }
}

/**
 * Désactive tous les contrôles d'une question sauf le bouton d'édition
 * @param {HTMLElement} questionDiv - Le conteneur de la question
 * @param {HTMLElement} editBtn - Le bouton d'édition à ne pas désactiver
 */
function disableQuestionControls(questionDiv, editBtn) {
  try {
    const controls = questionDiv.querySelectorAll("input, button, textarea, select");
    controls.forEach((c) => {
      if (c !== editBtn) c.disabled = true; // ne pas désactiver le bouton ✏️
    });
  } catch (e) {
    console.warn("Impossible de désactiver les contrôles", e);
  }
}

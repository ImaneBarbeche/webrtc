// Fonction pour créer les questions avec un input simple (ex: commune, année, statut)

import { setBirthYear } from "../timeline/birthYear.js";
import { sendEvent } from "./eventHandlers.js";
import { saveAnsweredQuestion } from "../stateMachine/persistence.js";

// Helper global: extraire l'année depuis différentes formes de chaîne de date
function extractYearFromDateString(val) {
  if (!val) return null;
  if (typeof val !== "string") return null;
  val = val.trim();
  // Format DD/MM/YYYY or DD-MM-YYYY
  let m = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return parseInt(m[3], 10);
  // Format YYYY-MM-DD
  m = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return parseInt(m[1], 10);
  // Format YYYY-MM
  m = val.match(/^(\d{4})-(\d{2})$/);
  if (m) return parseInt(m[1], 10);
  // ISO or other parsable by Date
  const d = new Date(val);
  if (!Number.isNaN(d.getTime())) return d.getFullYear();
  return null;
}

// Helper: construire une valeur YYYY-MM pour un input[type=month] à partir d'une valeur stockée
function buildMonthValueFromStored(stored) {
  if (!stored) return "";
  try {
    if (typeof stored === "string") {
      // ISO full
      if (/^\d{4}-\d{2}-\d{2}/.test(stored)) {
        return stored.split("T")[0].slice(0, 7); // YYYY-MM
      }
      // Already YYYY-MM
      if (/^\d{4}-\d{2}$/.test(stored)) return stored;
      // Year only
      if (/^\d{4}$/.test(stored)) return `${stored}-01`;
      // Other parseable
      const d = new Date(stored);
      if (!Number.isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        return `${yyyy}-${mm}`;
      }
    } else if (typeof stored === "number") {
      return `${String(stored)}-01`;
    }
  } catch (e) {
    return "";
  }
  return "";
}

/**
 * Crée un champ input simple avec gestion de l'édition
 * @param {HTMLElement} questionDiv - Le conteneur de la question
 * @param {object} state - L'état actuel de la machine
 * @param {string} eventType - Le type d'événement à envoyer (ex: "ANSWER_BIRTH_YEAR")
 * @param {string} eventKey - La clé pour les données (ex: "birthdate", "commune", "start")
 * @param {function} sendEvent - Fonction pour envoyer l'événement à la machine
 * @param {boolean} isHost - Si l'utilisateur est l'hôte (pour désactiver les contrôles)
 */
export function renderInputQuestion(
  questionDiv,
  state,
  eventType,
  eventKey,
  sendEvent,
  isHost = true
) {
  const input = document.createElement("input");

  // Déterminer si la question porte sur un temps (années, mois, jour, heure)
  const qText = questionDiv.querySelector("p")?.textContent || "";
  const isTimeQuestion =
    /ann(e|ée)|année|âge|age|date|jour|naiss|né|née|heure|h:/i.test(qText);

  if (isTimeQuestion) {
    // Utiliser un month picker natif (YYYY-MM) — affichage MM-YYYY souhaité côté UI
    input.type = "month";
    input.placeholder = "MM-YYYY";
  } else {
    input.type = "text";
    input.placeholder = "Votre réponse";
  }

  // Si une valeur existe déjà dans le contexte, la pré-remplir et désactiver
  if (state.context[eventKey]) {
    const stored = state.context[eventKey];
    try {
      if (input.type === "month") {
        // Construire YYYY-MM pour préremplir le month input
        const mval = buildMonthValueFromStored(stored);
        input.value = mval;
      } else {
        input.value = stored;
      }
    } catch (e) {
      input.value = state.context[eventKey];
    }
    input.disabled = true;
  }

  const editBtn = document.createElement("button");
  editBtn.innerHTML = '<i data-lucide="pencil"></i>';
  editBtn.className = "edit-btn";
  editBtn.style.display = state.context[eventKey] ? "inline-block" : "none";

  // Gestion du bouton d'édition
  editBtn.addEventListener("click", () => {
    input.disabled = false;
    input.focus();

    // Listener pour valider la modification avec Entrée
    function onEditKey(event) {
      if (event.key === "Enter" && String(input.value).trim() !== "") {
        handleEditUpdate(input, eventKey);
        input.disabled = true;
        cleanupEditListeners();
      }
    }

    function onEditChange() {
      // picker updates on change (month/date) — apply edit immediately
      if (String(input.value).trim() !== "") {
        handleEditUpdate(input, eventKey);
        input.disabled = true;
        cleanupEditListeners();
      }
    }

    function cleanupEditListeners() {
      input.removeEventListener("keypress", onEditKey);
      input.removeEventListener("change", onEditChange);
    }

    input.addEventListener("keypress", onEditKey);
    input.addEventListener("change", onEditChange);
  });

  // Listener pour la première réponse (Entrée) et pour les changements (date picker)
  function submitAnswer(value) {
    if (!eventType) return;
    const eventData = { type: eventType };
    // Normaliser les dates sélectionnées : envoyer uniquement l'année pour préserver la logique existante
    if (input.type === "month") {
      // value is YYYY-MM -> keep raw month value for history and send year for timeline compatibility
      const rawMonth = String(value);
      const y = extractYearFromDateString(rawMonth);
      eventData[eventKey] = y === null ? rawMonth : y;
      // keep the month string as well for record (won't break existing handlers)
      eventData[`${eventKey}_month`] = rawMonth;
    } else {
      eventData[eventKey] = value;
    }
    sendEvent(eventData);
    input.disabled = true;
    editBtn.style.display = "inline-block";
    if (isHost) disableQuestionControls(questionDiv, editBtn);
  }

  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && String(input.value).trim() !== "") {
      let val = input.value;
      if (input.type === "number") val = Number(val);
      if (input.type === "month") {
        const y = extractYearFromDateString(String(val));
        val = y === null ? val : y;
      }
      submitAnswer(val);
    }
  });
  // Pour les inputs de type month, envoyer aussi lors du changement (sélection)
  if (input.type === "month") {
    input.addEventListener("change", () => {
      if (input.value) {
        const raw = String(input.value); // YYYY-MM
        const y = extractYearFromDateString(raw);
        const out = y === null ? raw : y;
        // submitAnswer attend l'année ou la valeur brute; submitAnswer ajoutera aussi _month
        submitAnswer(out);
      }
    });
  }

  questionDiv.appendChild(input);
  questionDiv.appendChild(editBtn);

  // Transformer les icônes Lucide
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

/**
 * Rend deux champs de date côte à côte (arrivée / départ).
 * leftConfig et rightConfig sont des objets { label, eventType, eventKey }
 */
export function renderPairedDateInputs(
  questionDiv,
  state,
  leftConfig,
  rightConfig,
  sendEvent,
  isHost = true
) {
  const pair = document.createElement("div");
  pair.className = "date-pair";
  // marquer l'élément pour repérage ultérieur (commune/logement)
  const cIdx = state.context.currentCommuneIndex || 0;
  const lIdx = state.context.currentLogementIndex || 0;
  pair.dataset.pairId = `${
    state.value.includes("Commune")
      ? "pair_commune_c" + cIdx
      : "pair_housing_c" + cIdx + "_l" + lIdx
  }`;

  // Bouton d'édition global pour toute la paire
  const globalEditBtn = document.createElement("button");
  globalEditBtn.className = "edit-btn pair-edit-btn";
  globalEditBtn.innerHTML = '<i data-lucide="pencil"></i>';
  globalEditBtn.style.display = "none";
  globalEditBtn.dataset.editing = "false";

  function makeField(cfg) {
    const field = document.createElement("div");
    field.className = "date-field";

    const lbl = document.createElement("label");
    lbl.className = "date-field-label";
    lbl.innerText = cfg.label || "";

    const input = document.createElement("input");
    input.type = "month";
    input.placeholder = "MM-YYYY";
    input.dataset.eventKey = cfg.eventKey;
    input.dataset.eventType = cfg.eventType;

    // pré-remplir si valeur existante dans le contexte
    if (state.context && state.context[cfg.eventKey]) {
      const stored = state.context[cfg.eventKey];
      try {
        if (typeof stored === "string") {
          if (/^\d{4}-\d{2}/.test(stored)) input.value = stored.slice(0, 7);
          else if (/^\d{4}$/.test(stored)) input.value = `${stored}-01`;
        } else if (typeof stored === "number") {
          input.value = `${String(stored)}-01`;
        }
      } catch (e) {}
      input.disabled = true;
    }

    function submit(val) {
      if (!cfg.eventType) return;
      const ev = { type: cfg.eventType };
      // normalize: send year number when possible, but keep month in _month
      const raw = String(val);
      const y = new Date(raw + "-01").getFullYear();
      if (!Number.isNaN(y)) {
        ev[cfg.eventKey] = y;
        ev[`${cfg.eventKey}_month`] = raw;
      } else {
        ev[cfg.eventKey] = val;
      }
      sendEvent(ev);
      input.disabled = true;
       // Afficher le bouton d'édition global si les DEUX champs sont remplis
      checkAndShowEditButton();
      
    }

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && input.value) {
        submit(input.value);
      }
    });
    input.addEventListener("change", () => {
      if (input.value) submit(input.value);
    });

    field.appendChild(lbl);
    field.appendChild(input);
    return field;
  }

  // Générer les deux champs
  const leftField = makeField(leftConfig);
  const rightField = makeField(rightConfig);

  pair.appendChild(leftField);
  pair.appendChild(rightField);

// Vérifier si les deux champs sont remplis pour afficher l'édition
  function checkAndShowEditButton() {
    const leftInput = leftField.querySelector('input');
    const rightInput = rightField.querySelector('input');
    
    const bothFilled = leftInput.value && rightInput.value;
    const bothDisabled = leftInput.disabled && rightInput.disabled;
    
    if (bothFilled && bothDisabled) {
      globalEditBtn.style.display = 'inline-block';
      if (isHost) {
        // Désactiver tous les autres contrôles de la question
        disableQuestionControls(questionDiv, globalEditBtn);
      }
    }
  }
   // Gestion de l'édition globale
  globalEditBtn.addEventListener('click', () => {
    const isEditing = globalEditBtn.dataset.editing === 'true';
    const leftInput = leftField.querySelector('input');
    const rightInput = rightField.querySelector('input');
    
    if (isEditing) {
      // Terminer l'édition - sauvegarder les modifications
      const leftVal = leftInput.value;
      const rightVal = rightInput.value;
      
      if (leftVal) {
        handleEditUpdate(leftInput, leftConfig.eventKey);
      }
      if (rightVal) {
        handleEditUpdate(rightInput, rightConfig.eventKey);
      }
      
      leftInput.disabled = true;
      rightInput.disabled = true;
      globalEditBtn.innerHTML = '<i data-lucide="pencil"></i>';
      globalEditBtn.dataset.editing = 'false';
    } else {
      // Activer l'édition
      leftInput.disabled = false;
      rightInput.disabled = false;
      leftInput.focus();
      globalEditBtn.innerHTML = '<i data-lucide="check"></i>';
      globalEditBtn.dataset.editing = 'true';
      
      // Listener pour valider avec Enter
      function onEditKey(event) {
        if (event.key === "Enter") {
          globalEditBtn.click(); // Déclencher la validation
        }
      }
      leftInput.addEventListener("keypress", onEditKey, { once: true });
      rightInput.addEventListener("keypress", onEditKey, { once: true });
    }
    
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  });

  pair.appendChild(globalEditBtn);
  questionDiv.appendChild(pair);

  // Vérifier au chargement si on doit afficher le bouton
  setTimeout(checkAndShowEditButton, 100);

  if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
}
/**
 * NOUVELLE FONCTION: Rend deux champs de texte côte à côte (ex: statuts résidentiels)
 */
export function renderPairedTextInputs(
  questionDiv,
  state,
  leftConfig,
  rightConfig,
  sendEvent,
  isHost = true
) {
  const pair = document.createElement('div');
  pair.className = 'text-pair';
  const cIdx = state.context.currentCommuneIndex || 0;
  const lIdx = state.context.currentLogementIndex || 0;
  pair.dataset.pairId = `pair_status_c${cIdx}_l${lIdx}`;

  // Bouton d'édition global
  const globalEditBtn = document.createElement('button');
  globalEditBtn.className = 'edit-btn pair-edit-btn';
  globalEditBtn.innerHTML = '<i data-lucide="pencil"></i>';
  globalEditBtn.style.display = 'none';
  globalEditBtn.dataset.editing = 'false';

  function makeField(cfg) {
    const field = document.createElement('div');
    field.className = 'text-field';

    const lbl = document.createElement('label');
    lbl.className = 'text-field-label';
    lbl.innerText = cfg.label || '';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = cfg.placeholder || 'Votre réponse';
    input.dataset.eventKey = cfg.eventKey;
    input.dataset.eventType = cfg.eventType;

    // Pré-remplir si valeur existante
    if (state.context && state.context[cfg.eventKey]) {
      input.value = state.context[cfg.eventKey];
      input.disabled = true;
    }

    function submit(val) {
      if (!cfg.eventType || !val.trim()) return;
      const ev = { type: cfg.eventType };
      ev[cfg.eventKey] = val;
      sendEvent(ev);
      input.disabled = true;
      checkAndShowEditButton();
    }

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        submit(input.value);
      }
    });

    field.appendChild(lbl);
    field.appendChild(input);
    return field;
  }

  const leftField = makeField(leftConfig);
  const rightField = makeField(rightConfig);

  pair.appendChild(leftField);
  pair.appendChild(rightField);
  
  function checkAndShowEditButton() {
    const leftInput = leftField.querySelector('input');
    const rightInput = rightField.querySelector('input');
    
    const bothFilled = leftInput.value && rightInput.value;
    const bothDisabled = leftInput.disabled && rightInput.disabled;
    
    if (bothFilled && bothDisabled) {
      globalEditBtn.style.display = 'inline-block';
      if (isHost) {
        disableQuestionControls(questionDiv, globalEditBtn);
      }
    }
  }

  globalEditBtn.addEventListener('click', () => {
    const isEditing = globalEditBtn.dataset.editing === 'true';
    const leftInput = leftField.querySelector('input');
    const rightInput = rightField.querySelector('input');
    
    if (isEditing) {
      if (leftInput.value.trim()) {
        handleEditUpdate(leftInput, leftConfig.eventKey);
      }
      if (rightInput.value.trim()) {
        handleEditUpdate(rightInput, rightConfig.eventKey);
      }
      
      leftInput.disabled = true;
      rightInput.disabled = true;
      globalEditBtn.innerHTML = '<i data-lucide="pencil"></i>';
      globalEditBtn.dataset.editing = 'false';
    } else {
      leftInput.disabled = false;
      rightInput.disabled = false;
      leftInput.focus();
      globalEditBtn.innerHTML = '<i data-lucide="check"></i>';
      globalEditBtn.dataset.editing = 'true';
      
      function onEditKey(event) {
        if (event.key === "Enter") {
          globalEditBtn.click();
        }
      }
      leftInput.addEventListener("keypress", onEditKey, { once: true });
      rightInput.addEventListener("keypress", onEditKey, { once: true });
    }
    
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  });

  pair.appendChild(globalEditBtn);
  questionDiv.appendChild(pair);

  setTimeout(checkAndShowEditButton, 100);

  if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
}

/**
 * Gère la mise à jour d'une réponse existante
 */
function handleEditUpdate(input, eventKey) {
  let outVal = input.value;
  if (input.type === 'month') {
    const rawMonth = String(input.value);
    const y = extractYearFromDateString(rawMonth);
    if (["start","end","statut_res"].includes(eventKey)) {
      const parts = rawMonth.split('-');
      const yyyy = parts[0];
      const mm = parts[1] || '01';
      const dateObj = new Date(`${yyyy}-${mm}-01`);
      outVal = dateObj;
    } else {
      outVal = y === null ? rawMonth : y;
    }
  }

  const updateEvent = {
    type: "UPDATE_ANSWER",
    key: eventKey,
    value: outVal,
    updateEpisode: ["start", "end", "statut_res"].includes(eventKey),
  };
  sendEvent(updateEvent);
  saveAnsweredQuestion(eventKey, updateEvent);

  // Cas spécial pour l'année de naissance
  if (eventKey === "birthdate" || eventKey === "birthYear") {
    setBirthYear(outVal);
    if (window.timeline) {
      const birthYear = Number(outVal);
      const nowYear = new Date().getFullYear();
      const birthDate = new Date(birthYear, 0, 1);

      window.timeline.setCustomTime(birthDate, "custom-bar");
      window.timeline.setCustomTimeTitle(birthYear, "custom-bar");
      window.timeline.setCustomTime(new Date(`${birthYear}-01-01`), "birth-year-bar");
      window.timeline.setCustomTimeTitle(birthYear, "birth-year-bar");

      window.timeline.setOptions({
        min: new Date(birthYear - 4, 0, 1),
        start: new Date(birthYear - 4, 0, 1),
        format: {
          minorLabels: function (date, scale, step) {
            if (scale === "year") {
              const currentYear = new Date(date).getFullYear();
              const age = currentYear - birthYear;
              let label = `<b>${currentYear}</b>`;
              if (currentYear >= birthYear && currentYear <= nowYear) {
                label += `<br><span class="year-age">${age} ${age > 1 ? "ans" : "an"}</span>`;
              }
              return label;
            }
            let fmt;
            switch (scale) {
              case "millisecond": fmt = "SSS"; break;
              case "second": fmt = "s"; break;
              case "minute":
              case "hour": fmt = "HH:mm"; break;
              case "weekday": fmt = "ddd D"; break;
              case "day": fmt = "D"; break;
              case "week": fmt = "w"; break;
              case "month": fmt = "MMM"; break;
              case "year": fmt = "YYYY"; break;
              default: fmt = "D";
            }
            return vis.moment(date).format(fmt);
          },
        },
      });

      window.timeline.redraw();
      window.timeline.fit();
    }
  }
}


/**
 * Désactive tous les contrôles d'une question sauf le bouton d'édition
 */
function disableQuestionControls(questionDiv, editBtn) {
  try {
    const controls = questionDiv.querySelectorAll("input, button, textarea, select");
    controls.forEach((c) => {
      if (c !== editBtn) c.disabled = true;
    });
  } catch (e) {
    console.warn("Impossible de désactiver les contrôles", e);
  }
}

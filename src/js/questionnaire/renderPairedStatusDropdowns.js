// renderPairedStatusDropdowns.js
// Rend deux menus déroulants côte à côte pour le statut résidentiel (entrée/sortie)

export function renderPairedStatusDropdowns(
  questionDiv,
  state,
  leftConfig,
  rightConfig,
  sendEvent,
  isHost = true
) {
  const pair = document.createElement("div");
  pair.className = "dropdown-pair";
  const cIdx = state.context.currentCommuneIndex || 0;
  const lIdx = state.context.currentLogementIndex || 0;
  pair.dataset.pairId = `pair_status_c${cIdx}_l${lIdx}`;

  // Bouton d'édition global
  const globalEditBtn = document.createElement("button");
  globalEditBtn.className = "edit-btn pair-edit-btn";
  globalEditBtn.innerHTML = '<i data-lucide="pencil"></i>';
  globalEditBtn.style.display = "none";
  globalEditBtn.dataset.editing = "false";

  const statusOptions = [
    "Locataire",
    "Propriétaire",
    "Chez parents",
    "Logé par l'employeur",
    "Logement gratuit",
    "Autre"
  ];

  function makeDropdown(cfg) {
    const field = document.createElement("div");
    field.className = "dropdown-field";

    const lbl = document.createElement("label");
    lbl.className = "dropdown-label";
    lbl.innerText = cfg.label || "";

    const select = document.createElement("select");
    select.dataset.eventKey = cfg.eventKey;
    select.dataset.eventType = cfg.eventType;
    select.disabled = !isHost;

    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.innerText = "Choisissez...";
    select.appendChild(defaultOpt);

    statusOptions.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.innerText = opt;
      select.appendChild(option);
    });

    function submit(val) {
      if (!cfg.eventType || !val) return;
      const ev = { type: cfg.eventType };
      ev[cfg.eventKey] = val;
      sendEvent(ev);
      select.disabled = true;
      checkAndShowEditButton();
    }

    select.addEventListener("change", (e) => {
      if (select.value) {
        submit(select.value);
      }
    });

    field.appendChild(lbl);
    field.appendChild(select);
    return field;
  }

  const leftField = makeDropdown(leftConfig);
  const rightField = makeDropdown(rightConfig);

  pair.appendChild(leftField);
  pair.appendChild(rightField);

  function checkAndShowEditButton() {
    const leftSelect = leftField.querySelector("select");
    const rightSelect = rightField.querySelector("select");
    const bothFilled = leftSelect.value && rightSelect.value;
    const bothDisabled = leftSelect.disabled && rightSelect.disabled;
    if (bothFilled && bothDisabled) {
      globalEditBtn.style.display = "inline-block";
      if (isHost) {
        disableQuestionControls(questionDiv, globalEditBtn);
      }
    }
  }

  globalEditBtn.addEventListener("click", () => {
    const isEditing = globalEditBtn.dataset.editing === "true";
    const leftSelect = leftField.querySelector("select");
    const rightSelect = rightField.querySelector("select");
    if (isEditing) {
      if (leftSelect.value) {
        leftSelect.disabled = true;
      }
      if (rightSelect.value) {
        rightSelect.disabled = true;
      }
      globalEditBtn.innerHTML = '<i data-lucide="pencil"></i>';
      globalEditBtn.dataset.editing = "false";
    } else {
      leftSelect.disabled = false;
      rightSelect.disabled = false;
      leftSelect.focus();
      globalEditBtn.innerHTML = '<i data-lucide="check"></i>';
      globalEditBtn.dataset.editing = "true";
    }
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  });

  pair.appendChild(globalEditBtn);
  questionDiv.appendChild(pair);
  setTimeout(checkAndShowEditButton, 100);
  if (window.lucide && typeof window.lucide.createIcons === "function")
    window.lucide.createIcons();
}

function disableQuestionControls(questionDiv, editBtn) {
  try {
    const controls = questionDiv.querySelectorAll(
      "input, button, textarea, select"
    );
    controls.forEach((c) => {
      if (c !== editBtn) c.disabled = true;
    });
  } catch (e) {
    console.warn("Impossible de désactiver les contrôles", e);
  }
}

// renderPairedStatusDropdowns.js
// Renders two side-by-side dropdowns for residential status (entry / exit)

export function renderPairedStatusDropdowns(
  questionDiv,
  state,
  leftConfig,
  rightConfig,
  sendEvent,
  isHost = true
) {
  // Wrapper for the two dropdowns
  const pair = document.createElement("div");
  pair.className = "dropdown-pair";

  // Stable identifier for this pair (based on commune + housing index)
  const cIdx = state.context.currentCommuneIndex || 0;
  const lIdx = state.context.currentLogementIndex || 0;
  pair.dataset.pairId = `pair_status_c${cIdx}_l${lIdx}`;

  // Global edit button (controls both dropdowns)
  const globalEditBtn = document.createElement("button");
  globalEditBtn.className = "edit-btn pair-edit-btn";
  globalEditBtn.innerHTML = '<i data-lucide="pencil"></i>';
  globalEditBtn.style.display = "none"; // Hidden until both dropdowns are filled
  globalEditBtn.dataset.editing = "false";

  // Available residential status options
  const statusOptions = [
    "Locataire",
    "Propriétaire",
    "Chez parents",
    "Logé par l'employeur",
    "Logement gratuit",
    "Autre"
  ];

  /**
   * Creates a single dropdown (entry or exit).
   * Handles:
   *  - rendering label + select
   *  - disabling when not host
   *  - sending event on selection
   */
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

    // Default placeholder option
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.innerText = "Choisissez...";
    select.appendChild(defaultOpt);

    // Populate dropdown with status options
    statusOptions.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt;
      option.innerText = opt;
      select.appendChild(option);
    });

    /**
     * Sends the event when a value is selected.
     * Disables the dropdown afterward to prevent accidental changes.
     */
    function submit(val) {
      if (!cfg.eventType || !val) return;

      const ev = { type: cfg.eventType };
      ev[cfg.eventKey] = val;

      sendEvent(ev);
      select.disabled = true;

      // Check if both dropdowns are filled → show edit button
      checkAndShowEditButton();
    }

    // Trigger submit on selection
    select.addEventListener("change", () => {
      if (select.value) submit(select.value);
    });

    field.appendChild(lbl);
    field.appendChild(select);
    return field;
  }

  // Create left (entry) and right (exit) dropdowns
  const leftField = makeDropdown(leftConfig);
  const rightField = makeDropdown(rightConfig);

  pair.appendChild(leftField);
  pair.appendChild(rightField);

  /**
   * Shows the global edit button only when:
   *  - both dropdowns have a selected value
   *  - both dropdowns are disabled (meaning initial submission is done)
   */
  function checkAndShowEditButton() {
    const leftSelect = leftField.querySelector("select");
    const rightSelect = rightField.querySelector("select");

    const bothFilled = leftSelect.value && rightSelect.value;
    const bothDisabled = leftSelect.disabled && rightSelect.disabled;

    if (bothFilled && bothDisabled) {
      globalEditBtn.style.display = "inline-block";

      // Disable all other controls in the question block
      if (isHost) {
        disableQuestionControls(questionDiv, globalEditBtn);
      }
    }
  }

  /**
   * Handles edit mode:
   *  - First click → enable both dropdowns (switch to "check" icon)
   *  - Second click → save changes and disable again (switch back to pencil)
   */
  globalEditBtn.addEventListener("click", () => {
    const isEditing = globalEditBtn.dataset.editing === "true";
    const leftSelect = leftField.querySelector("select");
    const rightSelect = rightField.querySelector("select");

    if (isEditing) {
      // Save mode: disable dropdowns again
      if (leftSelect.value) leftSelect.disabled = true;
      if (rightSelect.value) rightSelect.disabled = true;

      globalEditBtn.innerHTML = '<i data-lucide="pencil"></i>';
      globalEditBtn.dataset.editing = "false";
    } else {
      // Edit mode: re-enable dropdowns
      leftSelect.disabled = false;
      rightSelect.disabled = false;
      leftSelect.focus();

      globalEditBtn.innerHTML = '<i data-lucide="check"></i>';
      globalEditBtn.dataset.editing = "true";
    }

    // Refresh Lucide icons
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  });

  pair.appendChild(globalEditBtn);
  questionDiv.appendChild(pair);

  // Delay check to allow DOM to settle
  setTimeout(checkAndShowEditButton, 100);

  // Initialize icons
  if (window.lucide && typeof window.lucide.createIcons === "function")
    window.lucide.createIcons();
}

/**
 * Disables all controls inside the question block except the edit button.
 * Prevents the user from interacting with other inputs once the pair is validated.
 */
function disableQuestionControls(questionDiv, editBtn) {
  try {
    const controls = questionDiv.querySelectorAll(
      "input, button, textarea, select"
    );
    controls.forEach((c) => {
      if (c !== editBtn) c.disabled = true;
    });
  } catch (e) {
    console.warn("Unable to disable controls", e);
  }
}

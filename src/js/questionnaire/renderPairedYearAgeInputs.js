// renderPairedYearAgeInputs.js
// Renders two paired inputs (year + age) for housing arrival and departure.

import { getBirthYear as getGlobalBirthYear } from "../timeline/birthYear.js";

export function renderPairedYearAgeInputs(
  questionDiv,
  state,
  leftConfig,
  rightConfig,
  sendEvent,
  isHost = true
) {
  // Container for the two pairs (arrival + departure)
  const pair = document.createElement("div");
  pair.className = "date-pair";

  // Vertical stacking for better spacing
  pair.style.display = "flex";
  pair.style.flexDirection = "column";
  pair.style.gap = "10px";

  // Assign a stable identifier to avoid duplicate rendering
  try {
    const pairId = `pair_housing_c${
      (state && state.context && state.context.currentCommuneIndex) || 0
    }_l${(state && state.context && state.context.currentLogementIndex) || 0}`;
    pair.setAttribute("data-pair-id", pairId);
  } catch (e) {}

  /**
   * Creates a single (year + age) input block.
   * Handles:
   *  - bidirectional sync between year and age
   *  - auto-validation with debounce
   *  - sending events when both fields are filled
   */
  function makeYearAgeField(cfg, onBothFilled) {
    const field = document.createElement("div");
    field.className = "date-field";

    const wrapper = document.createElement("div");
    wrapper.className = "year-age-pair";

    // --- YEAR INPUT ---
    const yearField = document.createElement("div");
    yearField.className = "year-field";

    const yearLabel = document.createElement("label");
    yearLabel.innerText = cfg.yearLabel || "Année";

    const yearInput = document.createElement("input");
    yearInput.type = "number";
    yearInput.placeholder = "YYYY";
    yearInput.min = 1800;
    yearInput.max = new Date().getFullYear();
    yearInput.step = 1;
    yearInput.dataset.eventKey = cfg.yearEventKey;
    yearInput.dataset.eventType = cfg.yearEventType;
    yearInput.disabled = !isHost;

    yearField.appendChild(yearLabel);
    yearField.appendChild(yearInput);

    // --- AGE INPUT ---
    const ageField = document.createElement("div");
    ageField.className = "age-field";

    const ageLabel = document.createElement("label");
    ageLabel.innerText = cfg.ageLabel || "Âge";

    const ageInput = document.createElement("input");
    ageInput.type = "number";
    ageInput.placeholder = "Âge";
    ageInput.min = 0;
    ageInput.max = 120;
    ageInput.step = 1;
    ageInput.dataset.eventKey = cfg.ageEventKey;
    ageInput.dataset.eventType = cfg.ageEventType;
    ageInput.disabled = !isHost;

    ageField.appendChild(ageLabel);
    ageField.appendChild(ageInput);

    /**
     * Retrieves the birth year from:
     *  1. config
     *  2. state context
     *  3. global timeline module
     *  4. fallback (2000)
     */
    function getBirthYear() {
      if (typeof cfg.birthYear === "string") {
        const match = cfg.birthYear.match(/\d{4}/);
        if (match) return parseInt(match[0], 10);
      }
      if (typeof cfg.birthYear === "number") return cfg.birthYear;

      if (state && state.context && state.context.birthYear) {
        const by = state.context.birthYear;
        if (typeof by === "string") {
          const m = by.match(/\d{4}/);
          if (m) return parseInt(m[0], 10);
        }
        if (typeof by === "number") return by;
      }

      try {
        const g = getGlobalBirthYear();
        if (g) return parseInt(g, 10);
      } catch (e) {}

      return 2000;
    }

    // Prevent infinite loops when syncing year <-> age
    let updating = false;

    // Debounce timers for auto-validation
    let yearDebounce = null;
    let ageDebounce = null;

    // --- YEAR → AGE sync ---
    yearInput.addEventListener("input", () => {
      if (updating) return;
      updating = true;

      if (yearInput.value) {
        const year = parseInt(String(yearInput.value), 10);
        const birthYear = getBirthYear();
        if (!isNaN(year) && !isNaN(birthYear)) {
          const age = year - birthYear;
          if (!isNaN(age) && age >= 0 && age <= 120) {
            ageInput.value = age;
          }
        }
      }

      updating = false;

      // Debounced validation
      if (yearDebounce) clearTimeout(yearDebounce);
      yearDebounce = setTimeout(() => checkAndSend(), 800);
    });

    // --- AGE → YEAR sync ---
    ageInput.addEventListener("input", () => {
      if (updating) return;
      updating = true;

      const age = parseInt(ageInput.value, 10);
      const birthYear = getBirthYear();
      if (!isNaN(age) && !isNaN(birthYear)) {
        const year = birthYear + age;
        if (year > 1800 && year < 3000) {
          yearInput.value = String(year);
        }
      }

      updating = false;

      if (ageDebounce) clearTimeout(ageDebounce);
      ageDebounce = setTimeout(() => checkAndSend(), 800);
    });

    /**
     * Explicit validation on blur or Enter key.
     */
    function tryValidate(e) {
      if (e.type === "keydown" && e.key !== "Enter") return;
      if (e.type === "focus" || e.type === "mousedown") return;
      checkAndSend();
    }

    yearInput.addEventListener("blur", tryValidate);
    yearInput.addEventListener("keydown", tryValidate);
    ageInput.addEventListener("blur", tryValidate);
    ageInput.addEventListener("keydown", tryValidate);

    /**
     * Validates both fields and triggers the callback when both are filled.
     * Also computes missing values when possible.
     */
    function checkAndSend() {
      let yearVal = yearInput.value?.trim() || null;
      let ageVal = ageInput.value?.trim() || null;

      const birthYear = getBirthYear();

      // Compute missing year from age
      if (!yearVal && ageVal && !isNaN(parseInt(ageVal, 10))) {
        yearVal = String(birthYear + parseInt(ageVal, 10));
        yearInput.value = yearVal;
      }

      // Compute missing age from year
      if (yearVal && !ageVal) {
        const yyyy = parseInt(String(yearVal).split("-")[0], 10);
        const computedAge = yyyy - birthYear;
        if (!isNaN(computedAge) && computedAge >= 0 && computedAge <= 120) {
          ageVal = String(computedAge);
          ageInput.value = ageVal;
        }
      }

      if (yearVal && ageVal && typeof onBothFilled === "function") {
        onBothFilled({ year: yearVal, age: ageVal, cfg });
      }
    }

    // Return API for parent component
    wrapper.appendChild(yearField);
    wrapper.appendChild(ageField);
    field.appendChild(wrapper);

    return {
      element: field,
      enable() {
        yearInput.disabled = false;
        ageInput.disabled = false;
      },
      disable() {
        yearInput.disabled = true;
        ageInput.disabled = true;
      },
      getValues() {
        return { year: yearInput.value, age: ageInput.value };
      },
      setValues(y, a) {
        if (y !== undefined) yearInput.value = y;
        if (a !== undefined) ageInput.value = a;
      },
    };
  }

  // Track completion state for both sides
  let leftFilled = false;
  let rightFilled = false;

  // Track whether events were already sent
  let leftSent = false;
  let rightSent = false;

  // Track episode IDs for UPDATE events
  let leftEpisodeId = null;
  let rightEpisodeId = null;

  function checkAllFilled() {
    if (leftFilled && rightFilled) {
      // Optional: additional logic when both sides are filled
    }
  }

  // --- LEFT FIELD (arrival) ---
  const leftFieldObj = makeYearAgeField(leftConfig, (data) => {
    const evYear = { type: leftConfig.yearEventType };

    // Extract YYYY even if input is YYYY-MM
    try {
      const y = String(data.year).split("-")[0];
      evYear[leftConfig.yearEventKey] = Number.isNaN(Number(y)) ? y : Number(y);
    } catch (e) {
      evYear[leftConfig.yearEventKey] = data.year;
    }

    const evAge = { type: leftConfig.ageEventType };
    evAge[leftConfig.ageEventKey] = data.age;

    try {
      const resp = sendEvent(evYear);
      // Capture episode ID if returned
      try {
        if (resp?.id) leftEpisodeId = resp.id;
        else if (resp?.context?.lastEpisode)
          leftEpisodeId = resp.context.lastEpisode.id;
      } catch (e) {}
      sendEvent(evAge);
    } catch (e) {
      console.warn("Failed to send left events", e);
    }

    leftFieldObj.disable();
    leftSent = true;
    leftFilled = true;
    checkAllFilled();
    if (leftSent && rightSent) editIcon.style.display = "inline-block";
  });

  // --- RIGHT FIELD (departure) ---
  const rightFieldObj = makeYearAgeField(rightConfig, (data) => {
    const evYear = { type: rightConfig.yearEventType };

    try {
      const y = String(data.year).split("-")[0];
      evYear[rightConfig.yearEventKey] = Number.isNaN(Number(y))
        ? y
        : Number(y);
    } catch (e) {
      evYear[rightConfig.yearEventKey] = data.year;
    }

    const evAge = { type: rightConfig.ageEventType };
    evAge[rightConfig.ageEventKey] = data.age;

    try {
      const resp = sendEvent(evYear);
      try {
        if (resp?.id) rightEpisodeId = resp.id;
        else if (resp?.context?.lastEpisode)
          rightEpisodeId = resp.context.lastEpisode.id;
      } catch (e) {}
      sendEvent(evAge);
    } catch (e) {
      console.warn("Failed to send right events", e);
    }

    rightFieldObj.disable();
    rightSent = true;
    rightFilled = true;
    checkAllFilled();
    if (leftSent && rightSent) editIcon.style.display = "inline-block";
  });

  pair.appendChild(leftFieldObj.element);
  pair.appendChild(rightFieldObj.element);

  // --- EDIT BUTTON (shared for both fields) ---
  const editIcon = document.createElement("button");
  editIcon.type = "button";
  editIcon.title = "Modifier";
  editIcon.className = "edit-btn secondary-button";
  editIcon.style.display = "none";
  editIcon.style.marginLeft = "8px";
  editIcon.innerHTML = '<i data-lucide="pencil"></i>';

  if (window.lucide && typeof window.lucide.createIcons === "function")
    window.lucide.createIcons();

  let editingAll = false;

  editIcon.addEventListener("click", () => {
    if (!leftSent || !rightSent) return;

    // Enter edit mode
    if (!editingAll) {
      leftFieldObj.enable();
      rightFieldObj.enable();
      editingAll = true;
      editIcon.innerHTML = '<i data-lucide="check"></i>';
      editIcon.title = "Enregistrer";
      if (window.lucide && typeof window.lucide.createIcons === "function")
        window.lucide.createIcons();
      return;
    }

    // Save edits (UPDATE mode, no advance)
    const leftVals = leftFieldObj.getValues();
    const rightVals = rightFieldObj.getValues();

    const evLeftYear = { type: leftConfig.yearEventType };
    try {
      const y = String(leftVals.year).split("-")[0];
      evLeftYear[leftConfig.yearEventKey] = Number.isNaN(Number(y))
        ? y
        : Number(y);
    } catch (e) {
      evLeftYear[leftConfig.yearEventKey] = leftVals.year;
    }
    if (leftEpisodeId) evLeftYear.episodeId = leftEpisodeId;

    const evLeftAge = { type: leftConfig.ageEventType };
    evLeftAge[leftConfig.ageEventKey] = leftVals.age;
    if (leftEpisodeId) evLeftAge.episodeId = leftEpisodeId;

    const evRightYear = { type: rightConfig.yearEventType };
    try {
      const y = String(rightVals.year).split("-")[0];
      evRightYear[rightConfig.yearEventKey] = Number.isNaN(Number(y))
        ? y
        : Number(y);
    } catch (e) {
      evRightYear[rightConfig.yearEventKey] = rightVals.year;
    }
    if (rightEpisodeId) evRightYear.episodeId = rightEpisodeId;

    const evRightAge = { type: rightConfig.ageEventType };
    evRightAge[rightConfig.ageEventKey] = rightVals.age;
    if (rightEpisodeId) evRightAge.episodeId = rightEpisodeId;

    try {
      sendEvent(evLeftYear, false);
      sendEvent(evLeftAge, false);
      sendEvent(evRightYear, false);
      sendEvent(evRightAge, false);
    } catch (e) {
      console.warn("Failed to send update events", e);
    }

    leftFieldObj.disable();
    rightFieldObj.disable();
    editingAll = false;

    editIcon.innerHTML = '<i data-lucide="pencil"></i>';
    editIcon.title = "Modifier";
    if (window.lucide && typeof window.lucide.createIcons === "function")
      window.lucide.createIcons();
  });

  pair.appendChild(editIcon);
  questionDiv.appendChild(pair);
}

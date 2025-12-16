// renderPairedYearAgeInputs.js
// Rend deux paires (année+âge) pour arrivée et départ logement

import { getBirthYear as getGlobalBirthYear } from '../timeline/birthYear.js';

export function renderPairedYearAgeInputs(
  questionDiv,
  state,
  leftConfig,
  rightConfig,
  sendEvent,
  isHost = true
) {
  const pair = document.createElement('div');
  pair.className = 'date-pair';
  // Stack arrival above departure for better vertical spacing
  pair.style.display = 'flex';
  pair.style.flexDirection = 'column';
  pair.style.gap = '10px';
  // Prevent duplicate rendering elsewhere by setting a stable pair id
  try {
    const pairId = `pair_housing_c${(state && state.context && state.context.currentCommuneIndex) || 0}_l${(state && state.context && state.context.currentLogementIndex) || 0}`;
    pair.setAttribute('data-pair-id', pairId);
  } catch (e) {}

  function makeYearAgeField(cfg, onBothFilled) {
    const field = document.createElement('div');
    field.className = 'date-field';

    const wrapper = document.createElement('div');
    wrapper.className = 'year-age-pair';

    // Année (month picker)
    const yearField = document.createElement('div');
    yearField.className = 'year-field';
    const yearLabel = document.createElement('label');
    yearLabel.innerText = cfg.yearLabel || 'Année';
    const yearInput = document.createElement('input');
    yearInput.type = 'month';
    yearInput.placeholder = 'MM-YYYY';
    yearInput.dataset.eventKey = cfg.yearEventKey;
    yearInput.dataset.eventType = cfg.yearEventType;
    yearInput.disabled = !isHost;
    yearField.appendChild(yearLabel);
    yearField.appendChild(yearInput);

    // Âge (number)
    const ageField = document.createElement('div');
    ageField.className = 'age-field';
    const ageLabel = document.createElement('label');
    ageLabel.innerText = cfg.ageLabel || 'Âge';
    const ageInput = document.createElement('input');
    ageInput.type = 'number';
    ageInput.placeholder = 'Âge';
    ageInput.min = 0;
    ageInput.max = 120;
    ageInput.step = 1;
    ageInput.dataset.eventKey = cfg.ageEventKey;
    ageInput.dataset.eventType = cfg.ageEventType;
    ageInput.disabled = !isHost;
    ageField.appendChild(ageLabel);
    ageField.appendChild(ageInput);

    // Synchronisation année <-> âge
    // On suppose que l'année de naissance est disponible dans cfg.birthYear (format YYYY)
    function getBirthYear() {
      // Priorité: cfg.birthYear -> state.context.birthYear -> timeline module -> fallback 2000
      if (typeof cfg.birthYear === 'string') {
        const match = cfg.birthYear.match(/\d{4}/);
        if (match) return parseInt(match[0], 10);
      }
      if (typeof cfg.birthYear === 'number') {
        return cfg.birthYear;
      }
      if (state && state.context && state.context.birthYear) {
        const by = state.context.birthYear;
        if (typeof by === 'string') {
          const m = by.match(/\d{4}/);
          if (m) return parseInt(m[0], 10);
        }
        if (typeof by === 'number') return by;
      }
      try {
        const g = getGlobalBirthYear();
        if (g) return parseInt(g, 10);
      } catch (e) {}
      return 2000;
    }

    let updating = false; // Pour éviter la boucle infinie


    // Synchronisation visuelle immédiate
    let yearDebounce = null;
    let ageDebounce = null;

    yearInput.addEventListener('input', () => {
      if (updating) return;
      updating = true;
      if (yearInput.value) {
        const [yyyy, mm] = yearInput.value.split('-');
        const year = parseInt(yyyy, 10);
        const month = parseInt(mm, 10) || 1;
        const birthYear = getBirthYear();
        const birthMonth = parseInt(cfg.birthMonth, 10) || 1;
        if (!isNaN(year) && !isNaN(birthYear)) {
          let age = year - birthYear;
          if (month < birthMonth) {
            age = age - 1;
          }
          // Si même année, mais mois d'arrivée < mois naissance, age = -1 (non valide)
          if (year === birthYear && month < birthMonth) {
            age = -1;
          }
          if (!isNaN(age) && age >= 0 && age <= 120) {
            ageInput.value = age;
          }
        }
      }
      updating = false;
      // debounce auto-validate after user stops interacting
      if (yearDebounce) clearTimeout(yearDebounce);
      yearDebounce = setTimeout(() => {
        checkAndSend();
      }, 800);
    });

    ageInput.addEventListener('input', () => {
      if (updating) return;
      updating = true;
      const age = parseInt(ageInput.value, 10);
      const birthYear = getBirthYear();
      if (!isNaN(age) && !isNaN(birthYear)) {
        let month = '01';
        if (yearInput.value) {
          const parts = yearInput.value.split('-');
          if (parts.length === 2) month = parts[1];
        }
        const year = birthYear + age;
        if (year > 1900 && year < 2100) {
          yearInput.value = year + '-' + month;
        }
      }
      updating = false;
      if (ageDebounce) clearTimeout(ageDebounce);
      ageDebounce = setTimeout(() => {
        checkAndSend();
      }, 800);
    });

    // Validation explicite : blur ou entrée
    function tryValidate(e) {
      if (e.type === 'keydown' && e.key !== 'Enter') return;
      // ignore focus/mousedown
      if (e.type === 'focus' || e.type === 'mousedown') return;
      checkAndSend();
    }
    yearInput.addEventListener('blur', tryValidate);
    yearInput.addEventListener('keydown', tryValidate);
    ageInput.addEventListener('blur', tryValidate);
    ageInput.addEventListener('keydown', tryValidate);
    // Note: do not prevent mousedown/default behavior — allow spinners and pickers to work

    function checkAndSend() {
      // Allow validation when only one field is provided by computing the other
      let yearVal = yearInput.value && yearInput.value.trim() ? yearInput.value.trim() : null;
      let ageVal = ageInput.value && String(ageInput.value).trim() ? String(ageInput.value).trim() : null;

      const birthYear = getBirthYear();
      const birthMonth = parseInt(cfg.birthMonth, 10) || 1;

      // If age provided but year missing, compute year from birthYear + age
      if (!yearVal && ageVal && !isNaN(parseInt(ageVal, 10)) && birthYear) {
        const ageNum = parseInt(ageVal, 10);
        let computedYear = birthYear + ageNum;
        // Use birthMonth as default month unless yearInput had a month
        const monthStr = String(birthMonth).padStart(2, '0');
        yearVal = `${computedYear}-${monthStr}`;
        yearInput.value = yearVal;
      }

      // If year provided but age missing, compute age
      if (yearVal && !ageVal && birthYear) {
        const parts = yearVal.split('-');
        const yyyy = parseInt(parts[0], 10);
        const mm = parseInt(parts[1], 10) || 1;
        let computedAge = yyyy - birthYear;
        if (mm < birthMonth) computedAge--;
        if (yyyy === birthYear && mm < birthMonth) computedAge = -1;
        if (!isNaN(computedAge) && computedAge >= 0 && computedAge <= 120) {
          ageVal = String(computedAge);
          ageInput.value = ageVal;
        }
      }

      if (yearVal && ageVal) {
        if (typeof onBothFilled === 'function') {
          onBothFilled({ year: yearVal, age: ageVal, cfg });
        }
      }
    }

    wrapper.appendChild(yearField);
    wrapper.appendChild(ageField);
    field.appendChild(wrapper);
    // API for parent control
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
      }
    };
  }

  // Pour chaque bloc (arrivée/départ), on ne passe à la suite que si les deux champs sont remplis
  let leftFilled = false;
  let rightFilled = false;
  
  let leftSent = false;
  let rightSent = false;
  // Track created episode ids so updates can target the correct timeline items
  let leftEpisodeId = null;
  let rightEpisodeId = null;

  function checkAllFilled() {
    if (leftFilled && rightFilled) {
      // Optionnel : callback ou action supplémentaire
    }
  }

  const leftFieldObj = makeYearAgeField(leftConfig, (data) => {
    // initial submit for left side: allow advancing
    const evYear = { type: leftConfig.yearEventType };
    // Send only the year (YYYY) part even if the picker contains YYYY-MM
    try {
      const y = String(data.year).split('-')[0];
      evYear[leftConfig.yearEventKey] = Number.isNaN(Number(y)) ? y : Number(y);
    } catch (e) {
      evYear[leftConfig.yearEventKey] = data.year;
    }
    const evAge = { type: leftConfig.ageEventType };
    evAge[leftConfig.ageEventKey] = data.age;
    try {
      const resp = sendEvent(evYear);
      // sendEvent returns lastEpisode when advancing; capture its id if present
      try {
        if (resp && resp.id) leftEpisodeId = resp.id;
        else if (resp && resp.context && resp.context.lastEpisode) leftEpisodeId = resp.context.lastEpisode.id;
      } catch (e) {}
      sendEvent(evAge);
    } catch (e) {
      console.warn('Failed to send left events', e);
    }
    leftFieldObj.disable();
    leftSent = true;
    leftFilled = true;
    checkAllFilled();
    if (leftSent && rightSent) editIcon.style.display = 'inline-block';
  });

  const rightFieldObj = makeYearAgeField(rightConfig, (data) => {
    // initial submit for right side: allow advancing
    const evYear = { type: rightConfig.yearEventType };
    try {
      const y = String(data.year).split('-')[0];
      evYear[rightConfig.yearEventKey] = Number.isNaN(Number(y)) ? y : Number(y);
    } catch (e) {
      evYear[rightConfig.yearEventKey] = data.year;
    }
    const evAge = { type: rightConfig.ageEventType };
    evAge[rightConfig.ageEventKey] = data.age;
    try {
      const resp = sendEvent(evYear);
      try {
        if (resp && resp.id) rightEpisodeId = resp.id;
        else if (resp && resp.context && resp.context.lastEpisode) rightEpisodeId = resp.context.lastEpisode.id;
      } catch (e) {}
      sendEvent(evAge);
    } catch (e) {
      console.warn('Failed to send right events', e);
    }
    rightFieldObj.disable();
    rightSent = true;
    rightFilled = true;
    checkAllFilled();
    if (leftSent && rightSent) editIcon.style.display = 'inline-block';
  });

  const leftField = leftFieldObj;
  const rightField = rightFieldObj;

  pair.appendChild(leftField.element);
  pair.appendChild(rightField.element);

  // Shared edit icon that unlocks both when both sides have been submitted
  const editIcon = document.createElement('button');
  editIcon.type = 'button';
  editIcon.title = 'Modifier';
  editIcon.className = 'edit-btn';
  editIcon.style.display = 'none';
  editIcon.style.marginLeft = '8px';
  editIcon.innerHTML = '<i data-lucide="pencil"></i>';
  if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  let editingAll = false;

  editIcon.addEventListener('click', () => {
    if (!leftSent || !rightSent) return;
    if (!editingAll) {
      leftField.enable();
      rightField.enable();
      editingAll = true;
      editIcon.innerHTML = '<i data-lucide="check"></i>';
      editIcon.title = 'Enregistrer';
      if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      return;
    }
    // Save edits via UPDATE (no advance)
    const leftVals = leftField.getValues();
    const rightVals = rightField.getValues();

    const evLeftYear = { type: leftConfig.yearEventType };
    try {
      const y = String(leftVals.year).split('-')[0];
      evLeftYear[leftConfig.yearEventKey] = Number.isNaN(Number(y)) ? y : Number(y);
    } catch (e) {
      evLeftYear[leftConfig.yearEventKey] = leftVals.year;
    }
    // include episode id to target modification
    if (leftEpisodeId) evLeftYear.episodeId = leftEpisodeId;
    const evLeftAge = { type: leftConfig.ageEventType };
    evLeftAge[leftConfig.ageEventKey] = leftVals.age;
    if (leftEpisodeId) evLeftAge.episodeId = leftEpisodeId;

    const evRightYear = { type: rightConfig.yearEventType };
    try {
      const y = String(rightVals.year).split('-')[0];
      evRightYear[rightConfig.yearEventKey] = Number.isNaN(Number(y)) ? y : Number(y);
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
      console.warn('Failed to send update events', e);
    }

    leftField.disable();
    rightField.disable();
    editingAll = false;
    editIcon.innerHTML = '<i data-lucide="pencil"></i>';
    editIcon.title = 'Modifier';
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  });

  pair.appendChild(editIcon);
  questionDiv.appendChild(pair);
}

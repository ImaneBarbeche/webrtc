let birthYear = '';

export function setBirthYear(year) {
  birthYear = year ? parseInt(year, 10) : '';
  const bYear = document.getElementById('birth-year');
  if (!bYear) return;
  // Always render the cake icon and a badge. When no year is set show '0'.
  const badgeText = birthYear ? String(birthYear) : '0';
  bYear.innerHTML = `
    <i data-lucide="cake" class="lucide" aria-hidden="true"></i>
    <span class="birth-year-badge" aria-hidden="true">${badgeText}</span>
  `;
  bYear.setAttribute('title', `Année de naissance: ${birthYear}`);
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
  // expose on window for other modules that may check it
  try {
    window.birthYear = birthYear;
  } catch (e) {}
}

export function getBirthYear() {
  return birthYear;
}

// Ramener la timeline au début
export function goToTimelineStart() {
  // Si une librairie timeline est utilisée et accessible globalement
  if (window.timeline && typeof window.timeline.moveTo === 'function') {
    // determine birth year from module or from window fallback
    const by = birthYear || (window.birthYear ? parseInt(window.birthYear, 10) : null);
    // Ramène la timeline à la date de naissance si connue
    if (by) {
      // Affiche la barre verticale de l'année de naissance si elle existe
      if (typeof window.timeline.setCustomTime === 'function') {
        const targetDate = new Date(`${by}-01-01`);
        // set the birth-year custom bar (used elsewhere)
        try { window.timeline.setCustomTime(targetDate, 'birth-year-bar'); } catch (e) {/* ignore */}
        // also set the main custom bar used for navigation/highlight if present
        try { window.timeline.setCustomTime(targetDate, 'custom-bar'); } catch (e) {/* ignore */}
        // optionally set titles
        try { window.timeline.setCustomTimeTitle(by, 'birth-year-bar'); } catch (e) {/* ignore */}
        try { window.timeline.setCustomTimeTitle(by, 'custom-bar'); } catch (e) {/* ignore */}
      }
      // then move the timeline to center on that date
      window.timeline.moveTo(new Date(`${by}-01-01`));
    } else if (window.timeline.options && window.timeline.options.min) {
      window.timeline.moveTo(window.timeline.options.min);
    } else {
      window.timeline.moveTo(new Date());
    }
    return;
  }
  // Fallback DOM : scroll horizontal au début
  const timeline = document.getElementById('timeline');
  if (timeline) {
    timeline.scrollLeft = 0;
  }
}

// Dézoomer complètement
export function zoomOutTimeline() {
  // Ne dézoome que si la librairie timeline est disponible
  if (window.timeline && typeof window.timeline.fit === 'function') {
    try {
      // ask for a moderately animated fit for smoother UX
      window.timeline.fit({ animation: { duration: 350 } });
    } catch (e) {
      try { window.timeline.fit(); } catch (e2) { /* ignore */ }
    }
  }
  // Sinon, ne fait rien (pas de scale CSS par défaut)
}

export function setupBirthYearButton() {
  function tryAttach() {
    const bYear = document.getElementById('birth-year');
    if (!bYear) {
      setTimeout(tryAttach, 100);
      return;
    }
    // Ensure the button shows the icon + badge immediately (shows '0' when empty)
    try { setBirthYear(birthYear); } catch (e) { /* ignore */ }
    if (!bYear._birthYearListenerAttached) {
      bYear.addEventListener('click', () => {
        if (bYear._birthYearBusy) return;
        bYear._birthYearBusy = true;

        const tl = window.timeline;
        let fallbackTimer = null;
        const finish = () => {
          bYear._birthYearBusy = false;
          if (fallbackTimer) {
            clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }
        };

        if (tl && typeof tl.on === 'function' && typeof tl.off === 'function') {
          const handler = () => {
            try {
              goToTimelineStart();
            } finally {
              try { tl.off('rangechanged', handler); } catch (e) {}
              finish();
            }
          };

          try {
            tl.on('rangechanged', handler);
          } catch (e) {
            // fallback to timeout if event registration fails
            zoomOutTimeline();
            fallbackTimer = setTimeout(() => { try { goToTimelineStart(); } finally { finish(); } }, 400);
            return;
          }

          // trigger fit which will eventually fire rangechanged
          zoomOutTimeline();

          // safety fallback in case rangechanged never fires
          fallbackTimer = setTimeout(() => {
            try { goToTimelineStart(); } finally {
              try { tl.off('rangechanged', handler); } catch (e) {}
              finish();
            }
          }, 800);
        } else {
          // fallback behavior for non-timeline environments
          zoomOutTimeline();
          fallbackTimer = setTimeout(() => { goToTimelineStart(); finish(); }, 300);
        }
      });
      bYear._birthYearListenerAttached = true;
    }
  }
  tryAttach();
}

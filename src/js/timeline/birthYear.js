let birthYear = '';

export function setBirthYear(year) {
  birthYear = year ? parseInt(year, 10) : '';
  const bYear = document.getElementById('birth-year');
  if (!bYear) return;
  if (!birthYear) {
    bYear.textContent = '';
    return;
  }
  bYear.innerHTML = `<i data-lucide="cake" class="lucide"></i> ${birthYear}`;
  console.log(bYear)
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

export function getBirthYear() {
  return birthYear;
}

// Ramener la timeline au début
export function goToTimelineStart() {
  // Si une librairie timeline est utilisée et accessible globalement
  if (window.timeline && typeof window.timeline.moveTo === 'function') {
    // Ramène la timeline à la date de naissance si connue
    if (window.birthYear) {
      window.timeline.moveTo(new Date(`${window.birthYear}-01-01`));
      // Affiche la barre verticale de l'année de naissance si elle existe
      if (typeof window.timeline.setCustomTime === 'function') {
        window.timeline.setCustomTime(new Date(`${window.birthYear}-01-01`), 'birth-year-bar');
      }
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
    window.timeline.fit();
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
    if (!bYear._birthYearListenerAttached) {
      bYear.addEventListener('click', () => {
        zoomOutTimeline();
        goToTimelineStart();
      });
      bYear._birthYearListenerAttached = true;
    }
  }
  tryAttach();
}

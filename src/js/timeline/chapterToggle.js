// chapterToggle.js

/**
 * Initialise le bouton toggle pour masquer/afficher les titres des chapitres
 * @param {HTMLElement} toggleBtn - Le bouton toggle-chapters
 * @param {Object} timeline - L'instance de la timeline
 */
export function setupChapterToggle(toggleBtn, timeline) {
  if (!toggleBtn) {
    console.warn("[chapterToggle] Bouton toggle-chapters introuvable");
    return;
  }

  let chaptersHidden = false;

  /**
   * Applique l'état de visibilité sur tous les titres de trajectoire
   */
  function applyChapterVisibility() {
    const chapterTitles = document.querySelectorAll(".trajectory-title");
    chapterTitles.forEach((chapter) => {
      if (chaptersHidden) {
        chapter.classList.add("closed");
      } else {
        chapter.classList.remove("closed");
      }
    });
  }

  // Événement clic sur le bouton
  toggleBtn.addEventListener("click", () => {
    chaptersHidden = !chaptersHidden;
    applyChapterVisibility();

    // Attendre la fin de la transition CSS avant de redessiner
    setTimeout(() => {
      if (timeline) {
        timeline.redraw();
      }
    }, 400);
  });

  // Observer les changements DOM de la timeline pour réappliquer l'état
  const timelineContainer = document.getElementById("timeline");
  if (timelineContainer) {
    const observer = new MutationObserver(() => {
      applyChapterVisibility();
    });

    observer.observe(timelineContainer, {
      childList: true,
      subtree: true,
    });
  }
}

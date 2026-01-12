// chapterToggle.js

/**
 * Initialize the toggle button to hide/show chapter titles
 * @param {HTMLElement} toggleBtn - The toggle-chapters button
 * @param {Object} timeline - The timeline instance
 */
export function setupChapterToggle(toggleBtn, timeline) {
  if (!toggleBtn) {
    console.warn("[chapterToggle] Toggle-chapters button not found");
    return;
  }

  // Store chaptersHidden on the timeline object for global access
  timeline._chaptersHidden = timeline._chaptersHidden ?? false;

  /**
   * Apply visibility state to all trajectory titles
   */
  function applyChapterVisibility() {
    const chapterTitles = document.querySelectorAll(".trajectory-title");
    chapterTitles.forEach((chapter) => {
      if (timeline._chaptersHidden) {
        chapter.classList.add("closed");
      } else {
        chapter.classList.remove("closed");
      }
    });
  }

  // Click event on the button
  toggleBtn.addEventListener("click", () => {
    timeline._chaptersHidden = !timeline._chaptersHidden;
    applyChapterVisibility();

    // Wait for CSS transition to complete before redrawing
    setTimeout(() => {
      if (timeline) {
        timeline.redraw();
      }
    }, 400);
  });

  // Observe timeline DOM changes to reapply state
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

  // Apply visibility on init
  applyChapterVisibility();
}

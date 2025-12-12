import { initTimeline } from "./timelineInit.js";
import { exportTimelineData, importTimelineData } from "./importExportUtils.js";
import { activateInitialLandmarks } from "./landmarkUtils.js";
import * as utils from "../utils.js";
import { test_items } from "../dataset.js";
import { setBirthYear, setupBirthYearButton } from "./birthYear.js";
import { toggleLandmark } from "./landmarkUtils.js";
import { handleDragStart, handleDragEnd } from "./dragHandlers.js";
import { setupSummaryHandlers } from "./summaryUtils.js";
import { setupZoomNavigation } from "./zoomNavigation.js";
import { groupsData } from "./timelineData.js";
import { setupInteractions } from "./timelineInteractions.js";
import { setupVerticalBar } from "./verticalBar.js";
import { scheduleRedraw } from "./timelineUtils.js";
import { detectAndShowOverlaps, initOverlapDetection } from "./overlapDetection.js";
import { setupChapterToggle } from "./chapterToggle.js";

// ===============================
// VARIABLES GLOBALES
// ===============================
let timeline;
const items = new vis.DataSet();
const groups = new vis.DataSet(groupsData);
const stepSize = 1000 * 60 * 60 * 24; // 1 jour en ms

// ===============================
// DOM
// ===============================
const summaryContainer = document.getElementById("bricks");
const viewSummaryBtn = document.getElementById("view-summary");
const closeSummaryBtn = document.getElementById("close-summary");
const toggleChaptersBtn = document.getElementById("toggle-chapters");
const zoomInBtns = document.querySelectorAll("#zoom-in");
const zoomOutBtns = document.querySelectorAll("#zoom-out");
const moveBackwardsBtns = document.querySelectorAll("#move-backwards");
const moveForwardsBtns = document.querySelectorAll("#move-forwards");

// Boutons Load / Export
document.getElementById("load").addEventListener("click", () => {
  importTimelineData(items, test_items, utils);
});
document.getElementById("export").addEventListener("click", async () => {
  await exportTimelineData(items);
});

// Creation de la timeline
document.addEventListener("DOMContentLoaded", () => {
  timeline = initTimeline();
  if (!timeline) return;

  window.timeline = timeline;

  // Initialiser le module de detection des chevauchements
  initOverlapDetection(items, groups);

  if (window.lucide?.createIcons) window.lucide.createIcons();

  // Flag pour eviter les appels recursifs lors de l'ajout de marqueurs de chevauchement
  let isDetectingOverlaps = false;

  // Fit/redraw sur ajout/update + detection des chevauchements
  items.on("add", (event, properties) => {
    // Ignorer les marqueurs de chevauchement pour eviter la boucle infinie
    const addedItems = properties?.items || [];
    const isOverlapMarker = addedItems.some(id => id.toString().startsWith("__overlap_"));
    // Ignorer aussi les gaps visuels (créés automatiquement) pour éviter le fit
    const isGapMarker = addedItems.some(id => id.toString().startsWith("gap-"));
    
    if (!isOverlapMarker && !isGapMarker) {
      try {
        // Si un seul item est ajouté (cas d'ajout d'un épisode),
        // centrer/scroller la timeline vers cet item plutôt que faire un fit global.
        if (addedItems.length === 1) {
          try {
            // Essayer d'utiliser focus si disponible
            if (typeof timeline.focus === 'function') {
              timeline.focus(addedItems[0]);
            } else {
              // Fallback: déplacer vers la date de début de l'item
              const newItem = items.get(addedItems[0]);
              if (newItem && newItem.start) timeline.moveTo(newItem.start);
            }
          } catch {
            try { timeline.fit(); } catch {}
          }
        } else {
          // Pour les loads/imports multiples, conserver le comportement fit
          timeline.fit();
        }
      } catch {}
    }
    
    scheduleRedraw(timeline);
    
    // Detecter les chevauchements (sauf si c'est un marqueur ou si deja en cours)
    if (!isOverlapMarker && !isDetectingOverlaps) {
      isDetectingOverlaps = true;
      setTimeout(() => {
        detectAndShowOverlaps();
        isDetectingOverlaps = false;
      }, 100);
    }
  });

  items.on("update", (event, properties) => {
    // Ignorer les marqueurs de chevauchement
    const updatedItems = properties?.items || [];
    const isOverlapMarker = updatedItems.some(id => id.toString().startsWith("__overlap_"));
    
    scheduleRedraw(timeline);
    
    // Detecter les chevauchements apres modification
    if (!isOverlapMarker && !isDetectingOverlaps) {
      isDetectingOverlaps = true;
      setTimeout(() => {
        detectAndShowOverlaps();
        isDetectingOverlaps = false;
      }, 100);
    }
  });

  items.on("remove", (event, properties) => {
    // Ignorer les marqueurs de chevauchement
    const removedItems = properties?.items || [];
    const isOverlapMarker = removedItems.some(id => id.toString().startsWith("__overlap_"));
    
    // Detecter les chevauchements apres suppression
    if (!isOverlapMarker && !isDetectingOverlaps) {
      isDetectingOverlaps = true;
      setTimeout(() => {
        detectAndShowOverlaps();
        isDetectingOverlaps = false;
      }, 100);
    }
  });

  document.dispatchEvent(new CustomEvent("timelineReady"));

  // Interactions et barre verticale
  setupInteractions(timeline, utils);
  setupVerticalBar(timeline, stepSize);
  
  // Resume
  setupSummaryHandlers({ summaryContainer, viewSummaryBtn, closeSummaryBtn });
  
  // Toggle chapitres
  setupChapterToggle(toggleChaptersBtn, timeline);
  
  // Landmarks init
  activateInitialLandmarks(groups);

  // Initialisation de la date de naissance
  try {
    let birthYearStored = localStorage.getItem("birthYear");
    if (!birthYearStored) {
      const answeredRaw = localStorage.getItem("lifestories_answered_questions");
      if (answeredRaw) {
        try {
          const answeredArr = JSON.parse(answeredRaw);
          const found =
            answeredArr.find(
              (obj) =>
                (obj.answer?.type === "ANSWER_BIRTH_YEAR" &&
                  obj.answer.birthdate) ||
                (obj.answer?.key === "birthYear" && obj.answer.value) ||
                /^\d{4}$/.test(obj.answer?.value)
            )?.answer?.birthdate ||
            answeredArr.find((obj) => obj.answer?.value)?.answer?.value;
          if (found) birthYearStored = found;
        } catch (e) {
          console.warn("Could not parse lifestories_answered_questions:", e);
        }
      }
    }
    if (birthYearStored) setBirthYear(birthYearStored);
    // Ensure the birth-year button has its click listener after reload
    try { setupBirthYearButton(); } catch (e) { /* ignore */ }
  } catch (e) {}

  setupZoomNavigation({
    timeline,
    zoomInBtns,
    zoomOutBtns,
    moveBackwardsBtns,
    moveForwardsBtns,
  });
});

// Exports
export {
  timeline,
  items,
  groups,
  handleDragStart,
  handleDragEnd,
  toggleLandmark,
  stepSize,
};

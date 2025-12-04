import { initTimeline } from "./timelineInit.js";
import { exportTimelineData, importTimelineData } from "./importExportUtils.js";
import { activateInitialLandmarks } from "./landmarkUtils.js";
import * as utils from "../utils.js";
import { test_items } from "../dataset.js";
import { setBirthYear } from "./birthYear.js";
import { toggleLandmark } from "./landmarkUtils.js";
import { handleDragStart, handleDragEnd } from "./dragHandlers.js";
import { setupSummaryHandlers } from "./summaryUtils.js";
import { setupZoomNavigation } from "./zoomNavigation.js";
import { groupsData } from "./timelineData.js";
import { setupInteractions } from "./timelineInteractions.js";
import { setupVerticalBar } from "./verticalBar.js";
import { scheduleRedraw } from "./timelineUtils.js";

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

// Création de la timeline
document.addEventListener("DOMContentLoaded", () => {
  timeline = initTimeline();
  if (!timeline) return;

  window.timeline = timeline;

  if (window.lucide?.createIcons) window.lucide.createIcons();

  // Fit/redraw sur ajout/update
  items.on("add", () => {
    try {
      timeline.fit();
    } catch {}
    scheduleRedraw(timeline);
  });

  items.on("update", () => {
    scheduleRedraw(timeline);
  });

  document.dispatchEvent(new CustomEvent("timelineReady"));

  // Interactions et barre verticale
  setupInteractions(timeline, utils);
  setupVerticalBar(timeline, stepSize);
  
  // Résumé
  setupSummaryHandlers({ summaryContainer, viewSummaryBtn, closeSummaryBtn });
  
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

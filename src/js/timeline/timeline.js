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
import {
  detectAndShowOverlaps,
  initOverlapDetection,
} from "./overlapDetection.js";
import { setupChapterToggle } from "./chapterToggle.js";

// ===============================
// GLOBAL VARIABLES
// ===============================
let timeline;
const items = new vis.DataSet();
const groups = new vis.DataSet(groupsData);
const stepSize = 1000 * 60 * 60 * 24; // 1 day in ms

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

// Load / Export Buttons
document.getElementById("load").addEventListener("click", () => {
  importTimelineData(items, test_items, utils);
});
document.getElementById("export").addEventListener("click", async () => {
  await exportTimelineData(items);
});

// Timeline creation
document.addEventListener("DOMContentLoaded", () => {
  timeline = initTimeline();
  if (!timeline) return;

  window.timeline = timeline; // For global access

  // Initialize the overlap detection module
  initOverlapDetection(items, groups);

  if (window.lucide?.createIcons) window.lucide.createIcons();

  // Flag to prevent recursive calls when adding overlap markers
  let isDetectingOverlaps = false;

  // Fit/redraw on add/update + overlap detection
  items.on("add", (event, properties) => {
    // Ignore overlap markers to prevent infinite loop
    const addedItems = properties?.items || [];
    const isOverlapMarker = addedItems.some((id) =>
      id.toString().startsWith("__overlap_")
    );
    // Also ignore visual gaps (created automatically) to avoid fit
    const isGapMarker = addedItems.some((id) =>
      id.toString().startsWith("gap-")
    );

    if (!isOverlapMarker && !isGapMarker) {
      // Automatic scrolling ONLY if the addition is programmatic (not via user interaction)
      const isManual = properties && properties.event && properties.event.trigger === 'manual';
      if (!isManual) {
        try {
          if (addedItems.length === 1) {
            try {
              const newItem = items.get(addedItems[0]);
              // Scroll to the end if end exists and is different from start, otherwise to the beginning
              if (
                newItem &&
                newItem.end &&
                (!newItem.start || newItem.end !== newItem.start)
              ) {
                timeline.moveTo(newItem.end);
              } else if (newItem && newItem.start) {
                timeline.moveTo(newItem.start);
              }
            } catch {
              try { timeline.fit(); } catch {}
            }
          } else {
            timeline.fit();
          }
        } catch {}
      }
    }

    scheduleRedraw(timeline);

    // Detect overlaps (unless it's a marker or already in progress)
    if (!isOverlapMarker && !isDetectingOverlaps) {
      isDetectingOverlaps = true;
      setTimeout(() => {
        detectAndShowOverlaps();
        isDetectingOverlaps = false;
      }, 100);
    }
  });

  items.on("update", (event, properties) => {
    // Ignore overlap markers
    const updatedItems = properties?.items || [];
    const isOverlapMarker = updatedItems.some((id) =>
      id.toString().startsWith("__overlap_")
    );

    scheduleRedraw(timeline);

    // Detect overlaps after modification
    if (!isOverlapMarker && !isDetectingOverlaps) {
      isDetectingOverlaps = true;
      setTimeout(() => {
        detectAndShowOverlaps();
        isDetectingOverlaps = false;
      }, 100);
    }
  });

  items.on("remove", (event, properties) => {
    // Ignore overlap markers
    const removedItems = properties?.items || [];
    const isOverlapMarker = removedItems.some((id) =>
      id.toString().startsWith("__overlap_")
    );

    // Detect overlaps after deletion
    if (!isOverlapMarker && !isDetectingOverlaps) {
      isDetectingOverlaps = true;
      setTimeout(() => {
        detectAndShowOverlaps();
        isDetectingOverlaps = false;
      }, 100);
    }
  });

  document.dispatchEvent(new CustomEvent("timelineReady"));

  // Interactions and vertical bar
  setupInteractions(timeline, utils);
  setupVerticalBar(timeline, stepSize);

  // Summary
  setupSummaryHandlers({ summaryContainer, viewSummaryBtn, closeSummaryBtn });

  // Toggle chapters
  setupChapterToggle(toggleChaptersBtn, timeline);

  // Landmarks initialization
  activateInitialLandmarks(groups);

  // Birth year initialization
  try {
    let birthYearStored = localStorage.getItem("birthYear");
    if (!birthYearStored) {
      const answeredRaw = localStorage.getItem(
        "lifestories_answered_questions"
      );
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
    try {
      setupBirthYearButton();
    } catch (e) {
      /* ignore */
    }
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

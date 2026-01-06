// verticalBar.js
import { items, groups } from "./timeline.js";
import { getBirthYear } from "./birthYear.js";
import { renderGroupLabel, isItemInRange } from "./timelineUtils.js";
import { timelineState } from "./timelineState.js";

/**
 * Initialize the custom vertical bar and highlight/summary logic
 */
export function setupVerticalBar(timeline, stepSize) {
  // Remove any existing custom time bar with id "custom-bar" before adding
  try {
    timeline.removeCustomTime("custom-bar");
  } catch (e) {
    // Ignore if it doesn't exist
  }
  let customTimeId;
  try {
    customTimeId = timeline.addCustomTime(
      `${timeline.options.end.getFullYear() - 10}-01-01`,
      "custom-bar"
    );
  } catch (e) {
    if (e.message && e.message.includes("duplicate id")) {
      timeline.setCustomTime(
        `${timeline.options.end.getFullYear() - 10}-01-01`,
        "custom-bar"
      );
      customTimeId = "custom-bar";
    } else {
      throw e;
    }
  }
  timelineState.customTimeId = customTimeId;

  let timechangeDebounce = null;
  // During drag: bar + fluid highlight + summary
  timeline.on("timechange", (event) => {
    timelineState.isCustomBarMoving = true;

    if (timechangeDebounce) {
      clearTimeout(timechangeDebounce);
    }

    const snappedTime = Math.round(event.time.getTime() / stepSize) * stepSize;
    const snappedDate = new Date(snappedTime);

    timeline.setCustomTime(snappedDate, timelineState.customTimeId);
    timeline.setCustomTimeTitle(snappedDate.getFullYear(), "custom-bar");

    timechangeDebounce = setTimeout(() => {
      highlightItems(snappedTime);
      // Real-time summary
      renderSummary(snappedTime);
      renderYearAndAge(snappedTime);
    }, 20);
  });

  // Reset the state after the drag
  timeline.on("timechanged", () => {
    timelineState.isCustomBarMoving = false;
  });
}

/**
 * Highlight items corresponding to the selected year
 */
function highlightItems(snappedTime) {
  items.forEach((item) => {
    const inRange = isItemInRange(item, snappedTime);
    const already = item.className?.includes?.("highlight");

    if (inRange && !already) {
      item.className = `${item.className || ""} highlight`.trim();
      items.update(item);
    } else if (!inRange && already) {
      item.className = (item.className || "")
        .replace("highlight", "")
        .replace(/  +/g, " ")
        .trim();
      items.update(item);
    }
  });
}

/**
 * Generate the summary displayed in #moreInfos
 */
function renderSummary(snappedTime) {
  const themeData = {};
  groups.get().forEach((group) => {
    // Include all groups, not just those with nestedGroups
    themeData[group.id] = {
      name: group.contentText,
      items: [],
      className: group.className || "",
    };
  });

  items.forEach((item) => {
    if (isItemInRange(item, snappedTime)) {
      if (!item.className?.includes?.("highlight")) {
        item.className = `${item.className || ""} highlight`.trim();
        items.update(item);
      }

      const groupObject = groups.get(item.group);
      const themeId = groupObject?.nestedInGroup || item.group;
      if (themeData[themeId]) {
        themeData[themeId].items.push({ item, groupObject });
      }
    }
  });

  const selectedYear = new Date(snappedTime).getFullYear();
  let html = "";
  const totalMatches = Object.values(themeData).reduce(
    (sum, t) => sum + (t.items?.length || 0),
    0
  );

  if (totalMatches <= 0) {
    html = `<p class="no-info">Aucune information disponible pour l'année ${selectedYear}.</p>`;
  } else {
    Object.keys(themeData).forEach((themeId) => {
      const theme = themeData[themeId];
      if (theme.items.length > 0) {
        html += `<div class='theme-section ${
          theme.className
        }' data-year="${selectedYear}">
                   <h3>${renderGroupLabel(groups.get(Number(themeId)))}</h3>
                   <div class="card-wrapper">`;

        theme.items.forEach(({ item, groupObject }) => {
          html += `<div class='card'>
                     <h4>${item.content}</h4>
                     <p>${renderGroupLabel(groupObject)}</p>
                   </div>`;
        });

        html += `</div></div>`;
      }
    });
  }

  const moreInfos = document.getElementById("moreInfos");
  if (moreInfos) {
    moreInfos.innerHTML = html;
    requestAnimationFrame(() => {
      moreInfos.querySelectorAll(".theme-section").forEach((section) => {
        section.classList.add("visible");
      });
      // Add here to transform the icons
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    });
  }
}

/**
 * Display the year and age
 */
function renderYearAndAge(snappedTime) {
  const yearEl = document.getElementById("year");
  if (!yearEl) return;

  const selectedYear = new Date(snappedTime).getFullYear();
  const birthYear = getBirthYear();
  const age = birthYear ? selectedYear - birthYear : "";

  yearEl.innerHTML = `
    <span>${selectedYear}</span>
    ${age !== "" ? `<span>${age} ans</span>` : ""}`;
}
